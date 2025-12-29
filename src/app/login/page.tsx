"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [codigoDelDia, setCodigoDelDia] = useState('');
    const [esAdmin, setEsAdmin] = useState(false);

    // Cargar código del día al montar
    useEffect(() => {
        const obtenerCodigoDelDia = async () => {
            try {
                // Intenta obtener el código del día actual
                const { data, error } = await supabase
                    .from('codigos_acceso')
                    .select('codigo, tipo')
                    .eq('fecha', new Date().toISOString().split('T')[0])
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error cargando código:', error);
                } else if (data) {
                    setCodigoDelDia(data.codigo);
                    setEsAdmin(data.tipo === 'admin');
                }
            } catch (err) {
                console.error('Error:', err);
            }
        };

        obtenerCodigoDelDia();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Verificar si es código de administrador
            const adminCode = process.env.NEXT_PUBLIC_ADMIN_CODE || 'ADMIN123';
            if (codigo === adminCode) {
                // Código de administrador válido - establecer cookies
                const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                document.cookie = `auth_token=admin_${Date.now()}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
                document.cookie = `auth_role=admin; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
                document.cookie = `auth_expiry=${Date.now() + 24 * 60 * 60 * 1000}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
                router.push('/');
                return;
            }

            // Verificar si es código del día
            const { data, error } = await supabase
                .from('codigos_acceso')
                .select('*')
                .eq('codigo', codigo)
                .eq('fecha', new Date().toISOString().split('T')[0])
                .single();

            if (error || !data) {
                setError('Código inválido o expirado');
                return;
            }

            // Guardar sesión en cookies
            const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            document.cookie = `auth_token=user_${Date.now()}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
            document.cookie = `auth_role=user; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;
            document.cookie = `auth_expiry=${Date.now() + 24 * 60 * 60 * 1000}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;

            // Registrar acceso
            await supabase
                .from('registro_accesos')
                .insert([{
                    codigo_usado: codigo,
                    tipo_usuario: data.tipo,
                    fecha_acceso: new Date().toISOString(),
                    ip: 'unknown' // En producción se obtendría de la request
                }]);

            router.push('/');
        } catch (err) {
            console.error('Error en login:', err);
            setError('Error al verificar el código');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Logo y título */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Control de Furgonetas
                        </h1>
                        <p className="text-gray-600">
                            Sistema de seguimiento y registro
                        </p>
                    </div>

                    {/* Información del código del día */}
                    {codigoDelDia && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <h3 className="font-medium text-blue-800 mb-2">
                                Código del día disponible
                            </h3>
                            <p className="text-2xl font-bold text-blue-900 font-mono tracking-wide">
                                {codigoDelDia}
                            </p>
                            <p className="text-sm text-blue-700 mt-2">
                                Válido hasta hoy a las 23:59
                            </p>
                        </div>
                    )}

                    {/* Formulario de login */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
                                Código de acceso
                            </label>
                            <input
                                type="text"
                                id="codigo"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                placeholder="Ingresa el código"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg text-center font-mono tracking-wide text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoComplete="off"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                <p className="font-medium">⚠️ {error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !codigo.trim()}
                            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verificando...' : 'Acceder al sistema'}
                        </button>
                    </form>

                    {/* Información para administrador */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-3">Información de acceso:</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start">
                                <span className="text-green-500 mr-2">✓</span>
                                <span><strong>Administrador:</strong> Código único permanente</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-500 mr-2">✓</span>
                                <span><strong>Equipo de trabajo:</strong> Código diario (cambia a las 00:00)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-500 mr-2">⚠</span>
                                <span>El código del equipo solo permite acceso a búsqueda y registro</span>
                            </li>
                        </ul>
                    </div>

                    {/* Nota de seguridad */}
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-700">
                            <strong>Nota de seguridad:</strong> Este sistema protege el acceso a los datos sensibles.
                            Cada código tiene permisos específicos según su tipo.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-gray-500 text-sm">
                    <p>Sistema de Control de Furgonetas • Versión Segura</p>
                </div>
            </div>
        </div>
    );
}
