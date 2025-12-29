import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        console.log('[REGENERAR-CODIGO] Iniciando regeneración de código diario');

        // Verificar que el usuario sea administrador (podríamos verificar cookies o token)
        // Por ahora, asumimos que el acceso ya está controlado por el middleware

        const hoy = new Date();
        const fecha = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
        console.log('[REGENERAR-CODIGO] Fecha actual:', fecha);

        // Generar nuevo código diario
        const codigoNuevo = generarCodigoDiario();
        console.log('[REGENERAR-CODIGO] Código generado:', codigoNuevo);

        // Primero, eliminar cualquier código diario de hoy existente
        console.log('[REGENERAR-CODIGO] Eliminando códigos diarios existentes para hoy...');
        const { error: deleteError, count: deleteCount } = await supabase
            .from('codigos_acceso')
            .delete()
            .eq('tipo', 'daily')
            .eq('fecha', fecha);

        if (deleteError) {
            console.error('[REGENERAR-CODIGO] Error eliminando código anterior:', deleteError);
            // Continuar de todos modos
        } else {
            console.log('[REGENERAR-CODIGO] Códigos eliminados correctamente');
        }

        // Insertar nuevo código diario
        console.log('[REGENERAR-CODIGO] Insertando nuevo código...', {
            codigo: codigoNuevo,
            tipo: 'daily',
            fecha: fecha,
            activo: true
        });

        const { data, error } = await supabase
            .from('codigos_acceso')
            .insert([{
                codigo: codigoNuevo,
                tipo: 'daily',
                fecha: fecha,
                activo: true
            }])
            .select()
            .single();

        if (error) {
            console.error('[REGENERAR-CODIGO] Error insertando nuevo código:', error);
            console.error('[REGENERAR-CODIGO] Detalles del error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });

            // Intentar una segunda estrategia: usar upsert en lugar de insert
            console.log('[REGENERAR-CODIGO] Intentando con upsert...');
            const { data: upsertData, error: upsertError } = await supabase
                .from('codigos_acceso')
                .upsert({
                    codigo: codigoNuevo,
                    tipo: 'daily',
                    fecha: fecha,
                    activo: true,
                    actualizado_en: new Date().toISOString()
                })
                .select()
                .single();

            if (upsertError) {
                console.error('[REGENERAR-CODIGO] Error con upsert:', upsertError);
                return NextResponse.json(
                    {
                        error: 'Error al regenerar el código diario',
                        details: upsertError.message
                    },
                    { status: 500 }
                );
            }

            console.log('[REGENERAR-CODIGO] Upsert exitoso:', upsertData);
            return NextResponse.json({
                success: true,
                codigo: codigoNuevo,
                fecha: fecha,
                mensaje: 'Código diario regenerado exitosamente (usando upsert)'
            });
        }

        console.log('[REGENERAR-CODIGO] Inserción exitosa:', data);

        return NextResponse.json({
            success: true,
            codigo: codigoNuevo,
            fecha: fecha,
            mensaje: 'Código diario regenerado exitosamente'
        });

    } catch (error) {
        console.error('[REGENERAR-CODIGO] Error en regenerar-codigo:', error);
        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        );
    }
}

// Función para generar código diario (ahora con componente aleatorio)
function generarCodigoDiario(): string {
    const crypto = require('crypto');
    // Generar 4 bytes aleatorios y convertirlos a hex (8 caracteres)
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    // También incluir timestamp para mayor unicidad
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `${randomPart.slice(0, 4)}${timestamp}`;
}
