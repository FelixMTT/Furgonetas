"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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

export default function Home() {
  const [matricula, setMatricula] = useState('');
  const [furgoneta, setFurgoneta] = useState<Furgoneta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const buscarFurgoneta = async () => {
    const matriculaBusqueda = matricula.trim().toUpperCase();

    if (!matriculaBusqueda) {
      setError('Por favor ingresa una matrícula');
      return;
    }

    console.log('Buscando matrícula:', matriculaBusqueda);

    setLoading(true);
    setError('');
    setSuccess('');
    setFurgoneta(null);

    try {
      const { data, error } = await supabase
        .from('listado_furgonetas')
        .select('*')
        .ilike('matriculas', `%${matriculaBusqueda}%`)
        .limit(1);

      console.log('Resultado de búsqueda:', { data, error });

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('Furgoneta encontrada:', data[0]);
        setFurgoneta(data[0]);
        setSuccess('Furgoneta encontrada');
      } else {
        // Intentar búsqueda más flexible eliminando posibles guiones o espacios
        const matriculaLimpia = matriculaBusqueda.replace(/[- ]/g, '');
        console.log('Intentando búsqueda flexible con:', matriculaLimpia);

        const { data: dataFlexible, error: errorFlexible } = await supabase
          .from('listado_furgonetas')
          .select('*')
          .ilike('matriculas', `%${matriculaLimpia}%`)
          .limit(1);

        if (errorFlexible) throw errorFlexible;

        if (dataFlexible && dataFlexible.length > 0) {
          console.log('Furgoneta encontrada con búsqueda flexible:', dataFlexible[0]);
          setFurgoneta(dataFlexible[0]);
          setSuccess('Furgoneta encontrada (búsqueda flexible)');
        } else {
          setError(`No se encontró ninguna furgoneta con la matrícula "${matriculaBusqueda}"`);
        }
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar la furgoneta. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoVisto = async () => {
    if (!furgoneta) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const ahora = new Date().toISOString();
      const updateData: any = {
        ultima_vez_visto: ahora,
      };

      // Si ya hay un último visto, lo movemos a hora_visto_anterior
      if (furgoneta.ultima_vez_visto) {
        updateData.hora_visto_anterior = furgoneta.ultima_vez_visto;
      }

      const { data, error } = await supabase
        .from('listado_furgonetas')
        .update(updateData)
        .eq('id', furgoneta.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setFurgoneta(data[0]);
        setSuccess('Avistamiento registrado exitosamente');
      }
    } catch (err) {
      setError('Error al registrar el avistamiento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calcularTiempoEntreAvistamientos = () => {
    if (!furgoneta?.hora_visto_anterior || !furgoneta?.ultima_vez_visto) {
      return null;
    }

    const anterior = new Date(furgoneta.hora_visto_anterior);
    const ultimo = new Date(furgoneta.ultima_vez_visto);
    const diferenciaMs = ultimo.getTime() - anterior.getTime();

    const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
    const minutos = Math.floor((diferenciaMs % (1000 * 60 * 60)) / (1000 * 60));

    return { horas, minutos };
  };

  const tiempoEntreAvistamientos = calcularTiempoEntreAvistamientos();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center relative">
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              🚐 Control de Furgonetas
            </h1>
            <div className="flex-1 flex justify-end">
              <Link
                href="/admin"
                className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Panel Admin
              </Link>
            </div>
          </div>
          <p className="text-gray-600">
            Sistema de seguimiento y registro de avistamientos
          </p>
        </header>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Buscar Furgoneta por Matrícula
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              placeholder="Ej: ABC-123"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && buscarFurgoneta()}
            />
            <button
              onClick={buscarFurgoneta}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Buscando...' : '🔍 Buscar'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {furgoneta && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {furgoneta.matriculas}
                </h2>
                <p className="text-gray-600">ID: {furgoneta.id}</p>
              </div>
              <div className="text-right">
                <button
                  onClick={marcarComoVisto}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Marcar como Visto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Driver Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Conductor
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-900">
                      <span className="font-medium">Nombre:</span>{' '}
                      {furgoneta.nombre_conductor}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">Teléfono:</span>{' '}
                      {furgoneta.telefono_conductor}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Chaleco
                  </h3>
                  <p className="text-lg text-gray-900">{furgoneta.chaleco}</p>
                </div>
              </div>

              {/* Responsible Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Responsable
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-900">
                      <span className="font-medium">Nombre:</span>{' '}
                      {furgoneta.responsable}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">Teléfono:</span>{' '}
                      {furgoneta.telefono_responsable}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Historial de Avistamientos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-medium text-gray-600 mb-2">
                    Última vez visto
                  </h4>
                  <p className="text-lg text-gray-900">
                    {furgoneta.ultima_vez_visto
                      ? new Date(furgoneta.ultima_vez_visto).toLocaleString('es-ES')
                      : 'Nunca registrado'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-medium text-gray-600 mb-2">
                    Anterior avistamiento
                  </h4>
                  <p className="text-lg text-gray-900">
                    {furgoneta.hora_visto_anterior
                      ? new Date(furgoneta.hora_visto_anterior).toLocaleString('es-ES')
                      : 'No disponible'}
                  </p>
                </div>

                {tiempoEntreAvistamientos && (
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-medium text-blue-700 mb-2">
                      ⏱️ Tiempo entre avistamientos
                    </h4>
                    <p className="text-xl font-bold text-gray-900">
                      {tiempoEntreAvistamientos.horas} horas y{' '}
                      {tiempoEntreAvistamientos.minutos} minutos
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-4">
            <p className="font-medium">⚠️ {error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-4">
            <p className="font-medium">✅ {success}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Instrucciones
          </h3>
          <ul className="space-y-2 text-gray-800">
            <li>1. Ingresa la matrícula de la furgoneta en el campo de búsqueda</li>
            <li>2. Presiona "Buscar" para localizar la furgoneta</li>
            <li>3. Revisa los datos mostrados</li>
            <li>4. Al ver la furgoneta físicamente, presiona "Marcar como Visto"</li>
            <li>5. El sistema registrará el avistamiento y calculará el tiempo desde el anterior</li>
          </ul>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-700 text-sm">
          <p>Sistema de Control de Furgonetas • Desarrollado para Vercel</p>
        </footer>
      </div>
    </div>
  );
}
