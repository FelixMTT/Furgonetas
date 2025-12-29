"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Furgoneta {
    id: number;
    nombre_conductor: string;
    matriculas: string;
    chaleco: string;
    responsable: string;
    telefono_responsable: number;
    telefono_conductor: number;
    hora_visto_anterior: string | null;
    ultima_vez_visto: string | null;
}

export default function AdminPage() {
    const [furgonetas, setFurgonetas] = useState<Furgoneta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [codigoDiario, setCodigoDiario] = useState<string>('');
    const [regenerando, setRegenerando] = useState(false);
    const [mensajeCodigo, setMensajeCodigo] = useState('');
    const router = useRouter();

    const cargarFurgonetas = async () => {
        try {
            const { data, error } = await supabase
                .from('listado_furgonetas')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            setFurgonetas(data || []);
        } catch (err) {
            setError('Error al cargar las furgonetas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const eliminarFurgoneta = async (id: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta furgoneta?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('listado_furgonetas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Actualizar la lista
            cargarFurgonetas();
        } catch (err) {
            setError('Error al eliminar la furgoneta');
            console.error(err);
        }
    };

    const cargarCodigoDiario = async () => {
        try {
            const hoy = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('codigos_acceso')
                .select('codigo')
                .eq('tipo', 'daily')
                .eq('fecha', hoy)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error cargando código diario:', error);
                setCodigoDiario('No disponible');
            } else if (data) {
                setCodigoDiario(data.codigo);
            } else {
                setCodigoDiario('No generado');
            }
        } catch (err) {
            console.error('Error:', err);
            setCodigoDiario('Error al cargar');
        }
    };

    const regenerarCodigoDiario = async () => {
        if (!confirm('¿Estás seguro de que quieres regenerar el código diario? Esto invalidará el código actual y generará uno nuevo.')) {
            return;
        }

        setRegenerando(true);
        setMensajeCodigo('');

        try {
            console.log('Llamando a la API de regeneración...');
            const response = await fetch('/api/admin/regenerar-codigo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin', // Incluir cookies de sesión
            });

            console.log('Respuesta de la API:', response);

            const result = await response.json();
            console.log('Resultado de la API:', result);

            if (result.success) {
                setCodigoDiario(result.codigo);
                setMensajeCodigo('✅ ' + result.mensaje);
                // Recargar el código diario para asegurarse de que se actualiza
                setTimeout(() => {
                    cargarCodigoDiario();
                }, 500);
            } else {
                setMensajeCodigo('❌ Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error regenerando código:', error);
            setMensajeCodigo('❌ Error al regenerar el código');
        } finally {
            setRegenerando(false);
        }
    };

    useEffect(() => {
        cargarFurgonetas();
        cargarCodigoDiario();
    }, []);

    const furgonetasFiltradas = furgonetas.filter(f =>
        f.matriculas.toLowerCase().includes(search.toLowerCase()) ||
        f.nombre_conductor.toLowerCase().includes(search.toLowerCase()) ||
        f.responsable?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-xl">Cargando...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
                            <p className="text-gray-600">Gestión de furgonetas</p>
                        </div>
                        <div className="flex gap-4">
                            <Link
                                href="/"
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Volver a búsqueda
                            </Link>
                            <Link
                                href="/admin/nueva"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                + Nueva Furgoneta
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Search and Stats */}
                <div className="bg-white rounded-xl shadow p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-medium text-blue-700">Total Furgonetas</h3>
                            <p className="text-3xl font-bold text-blue-800">{furgonetas.length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="font-medium text-green-700">Con avistamientos</h3>
                            <p className="text-3xl font-bold text-green-800">
                                {furgonetas.filter(f => f.ultima_vez_visto).length}
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="font-medium text-yellow-700">Sin avistamientos</h3>
                            <p className="text-3xl font-bold text-yellow-800">
                                {furgonetas.filter(f => !f.ultima_vez_visto).length}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="font-medium text-purple-700">Código Diario</h3>
                            <p className="text-3xl font-bold text-purple-800 font-mono">{codigoDiario}</p>
                            <p className="text-sm text-purple-600 mt-1">Válido hasta 23:59</p>

                            <button
                                onClick={regenerarCodigoDiario}
                                disabled={regenerando}
                                className="mt-3 w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {regenerando ? 'Regenerando...' : '🔄 Regenerar Código'}
                            </button>

                            {mensajeCodigo && (
                                <div className={`mt-2 text-sm font-medium ${mensajeCodigo.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                                    {mensajeCodigo}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por matrícula, conductor o responsable..."
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={cargarFurgonetas}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-4">
                        <p className="font-medium">⚠️ {error}</p>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Matrícula
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Conductor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chaleco
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Responsable
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Último avistamiento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {furgonetasFiltradas.map((furgoneta) => (
                                    <tr key={furgoneta.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {furgoneta.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                            {furgoneta.matriculas}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {furgoneta.nombre_conductor}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${furgoneta.chaleco === 'verde'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {furgoneta.chaleco}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {furgoneta.responsable || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {furgoneta.ultima_vez_visto
                                                ? new Date(furgoneta.ultima_vez_visto).toLocaleDateString('es-ES')
                                                : 'Nunca'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => router.push(`/admin/editar/${furgoneta.id}`)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => eliminarFurgoneta(furgoneta.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {furgonetasFiltradas.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No se encontraron furgonetas</p>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="mt-2 text-blue-600 hover:text-blue-800"
                                >
                                    Limpiar búsqueda
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">📋 Instrucciones del Panel</h3>
                    <ul className="space-y-2 text-blue-700">
                        <li>• Usa el campo de búsqueda para filtrar por matrícula, conductor o responsable.</li>
                        <li>• Haz clic en "Editar" para modificar los datos de una furgoneta.</li>
                        <li>• Haz clic en "Eliminar" para quitar una furgoneta del sistema (acción irreversible).</li>
                        <li>• Usa "Nueva Furgoneta" para añadir un nuevo vehículo a la base de datos.</li>
                    </ul>
                </div>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Panel de Administración • Sistema de Control de Furgonetas</p>
                </div>
            </div>
        </div>
    );
}
