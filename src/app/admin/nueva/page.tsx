"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NuevaFurgonetaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        matriculas: '',
        nombre_conductor: '',
        chaleco: 'verde',
        responsable: '',
        telefono_responsable: '',
        telefono_conductor: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('telefono') ? value.replace(/\D/g, '') : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validaciones básicas
        if (!formData.matriculas.trim()) {
            setError('La matrícula es obligatoria');
            setLoading(false);
            return;
        }

        if (!formData.nombre_conductor.trim()) {
            setError('El nombre del conductor es obligatorio');
            setLoading(false);
            return;
        }

        try {
            const insertData = {
                matriculas: formData.matriculas.toUpperCase().trim(),
                nombre_conductor: formData.nombre_conductor.trim(),
                chaleco: formData.chaleco,
                responsable: formData.responsable.trim() || null,
                telefono_responsable: formData.telefono_responsable ? parseInt(formData.telefono_responsable) : null,
                telefono_conductor: formData.telefono_conductor ? parseInt(formData.telefono_conductor) : null,
            };

            const { error } = await supabase
                .from('listado_furgonetas')
                .insert([insertData]);

            if (error) throw error;

            setSuccess('Furgoneta creada exitosamente');

            // Limpiar formulario después de 2 segundos y redirigir
            setTimeout(() => {
                router.push('/admin');
            }, 2000);

        } catch (err) {
            console.error('Error creando furgoneta:', err);
            setError('Error al crear la furgoneta. Verifica los datos e intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Nueva Furgoneta</h1>
                            <p className="text-gray-600">Agregar un nuevo vehículo al sistema</p>
                        </div>
                        <Link
                            href="/admin"
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Volver al panel
                        </Link>
                    </div>
                </header>

                {/* Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
                        <p className="font-medium">⚠️ {error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6">
                        <p className="font-medium">✅ {success}</p>
                        <p className="text-sm mt-1">Redirigiendo al panel de administración...</p>
                    </div>
                )}

                {/* Form */}
                <div className="bg-white rounded-xl shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Matrícula */}
                            <div>
                                <label htmlFor="matriculas" className="block text-sm font-medium text-gray-700 mb-2">
                                    Matrícula *
                                </label>
                                <input
                                    type="text"
                                    id="matriculas"
                                    name="matriculas"
                                    value={formData.matriculas}
                                    onChange={handleChange}
                                    placeholder="Ej: ABC-123"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">Ingresa la matrícula de la furgoneta</p>
                            </div>

                            {/* Nombre Conductor */}
                            <div>
                                <label htmlFor="nombre_conductor" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre del Conductor *
                                </label>
                                <input
                                    type="text"
                                    id="nombre_conductor"
                                    name="nombre_conductor"
                                    value={formData.nombre_conductor}
                                    onChange={handleChange}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Chaleco */}
                            <div>
                                <label htmlFor="chaleco" className="block text-sm font-medium text-gray-700 mb-2">
                                    Color de Chaleco
                                </label>
                                <select
                                    id="chaleco"
                                    name="chaleco"
                                    value={formData.chaleco}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="verde">Verde</option>
                                    <option value="amarillo">Amarillo</option>
                                    <option value="naranja">Naranja</option>
                                    <option value="rojo">Rojo</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            {/* Responsable */}
                            <div>
                                <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
                                    Responsable
                                </label>
                                <input
                                    type="text"
                                    id="responsable"
                                    name="responsable"
                                    value={formData.responsable}
                                    onChange={handleChange}
                                    placeholder="Ej: Empresa Logística S.A."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Teléfono Conductor */}
                            <div>
                                <label htmlFor="telefono_conductor" className="block text-sm font-medium text-gray-700 mb-2">
                                    Teléfono del Conductor
                                </label>
                                <input
                                    type="tel"
                                    id="telefono_conductor"
                                    name="telefono_conductor"
                                    value={formData.telefono_conductor}
                                    onChange={handleChange}
                                    placeholder="Ej: 612345678"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="mt-1 text-sm text-gray-500">Solo números, sin espacios ni guiones</p>
                            </div>

                            {/* Teléfono Responsable */}
                            <div>
                                <label htmlFor="telefono_responsable" className="block text-sm font-medium text-gray-700 mb-2">
                                    Teléfono del Responsable
                                </label>
                                <input
                                    type="tel"
                                    id="telefono_responsable"
                                    name="telefono_responsable"
                                    value={formData.telefono_responsable}
                                    onChange={handleChange}
                                    placeholder="Ej: 912345678"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="mt-1 text-sm text-gray-500">Solo números, sin espacios ni guiones</p>
                            </div>
                        </div>

                        {/* Required fields note */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-700">
                                <span className="font-medium">Nota:</span> Los campos marcados con * son obligatorios.
                                Los teléfonos son opcionales pero recomendados para contactar en caso necesario.
                            </p>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Link
                                href="/admin"
                                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creando...' : 'Crear Furgoneta'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Quick Tips */}
                <div className="mt-8 bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">💡 Consejos para agregar furgonetas</h3>
                    <ul className="space-y-2 text-blue-700">
                        <li>• Ingresa la matrícula en el formato exacto como aparece en el vehículo.</li>
                        <li>• Los teléfonos deben contener solo números (ej: 612345678).</li>
                        <li>• El color del chaleco ayuda a identificar rápidamente al conductor.</li>
                        <li>• El responsable puede ser una empresa o persona encargada del vehículo.</li>
                        <li>• Después de crear la furgoneta, podrás usarla en el sistema de búsqueda.</li>
                    </ul>
                </div>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Formulario de alta de furgonetas • Sistema de Control de Furgonetas</p>
                </div>
            </div>
        </div>
    );
}
