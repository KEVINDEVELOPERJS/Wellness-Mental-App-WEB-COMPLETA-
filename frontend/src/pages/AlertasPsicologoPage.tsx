import { useState, useEffect } from 'react';
import { alertaService } from '../services/alertaService';
import { useUIStore } from '../store/uiStore';
import { AlertaRiesgo } from '../types/alerta';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  RefreshCw,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  X
} from 'lucide-react';

export default function AlertasPsicologoPage() {
  const { addToast } = useUIStore();
  const [alertas, setAlertas] = useState<AlertaRiesgo[]>([]);
  const [filteredAlertas, setFilteredAlertas] = useState<AlertaRiesgo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaRiesgo | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterNivel, setFilterNivel] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    loadAlertas();
  }, []);

  useEffect(() => {
    let filtered = alertas;
    
    if (filterEstado) {
      filtered = filtered.filter(a => a.estado === filterEstado);
    }
    
    if (filterNivel) {
      filtered = filtered.filter(a => a.nivelRiesgo === filterNivel);
    }
    
    setFilteredAlertas(filtered);
  }, [filterEstado, filterNivel, alertas]);

  const loadAlertas = async () => {
    setIsLoading(true);
    try {
      const data = await alertaService.getAlertas();
      setAlertas(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las alertas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlertaEstado = async (estado: string) => {
    if (!selectedAlerta) return;

    setIsUpdating(true);
    try {
      const updated = await alertaService.actualizarEstado(
        selectedAlerta.id,
        estado,
        notas
      );
      
      setAlertas(alertas.map(a => a.id === selectedAlerta.id ? updated : a));
      setSelectedAlerta(updated);
      setNotas('');
      
      addToast({
        type: 'success',
        title: 'Alerta actualizada',
        message: `Estado cambiado a ${estado}`,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar la alerta',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'ALTO': return 'bg-red-500';
      case 'MEDIO': return 'bg-yellow-500';
      case 'BAJO': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-red-100 text-red-700';
      case 'ATENDIDA': return 'bg-green-100 text-green-700';
      case 'EN_SEGUIMIENTO': return 'bg-yellow-100 text-yellow-700';
      case 'DERIVADA': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: alertas.length,
    pendientes: alertas.filter(a => a.estado === 'PENDIENTE').length,
    altoRiesgo: alertas.filter(a => a.nivelRiesgo === 'ALTO').length,
    atendidas: alertas.filter(a => a.estado === 'ATENDIDA').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Alertas de Riesgo</h1>
          <p className="text-muted-foreground">
            Monitoreo y gestión de alertas de bienestar de usuarios
          </p>
        </div>
        <button
          onClick={loadAlertas}
          className="flex items-center space-x-2 px-4 py-2 bg-secondary rounded-lg hover:bg-accent transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} color="text-blue-500" bgColor="bg-blue-50" />
        <StatCard label="Pendientes" value={stats.pendientes} color="text-red-500" bgColor="bg-red-50" />
        <StatCard label="Alto Riesgo" value={stats.altoRiesgo} color="text-orange-500" bgColor="bg-orange-50" />
        <StatCard label="Atendidas" value={stats.atendidas} color="text-green-500" bgColor="bg-green-50" />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-4 border flex items-center space-x-4">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ATENDIDA">Atendida</option>
          <option value="EN_SEGUIMIENTO">En seguimiento</option>
          <option value="DERIVADA">Derivada</option>
        </select>
        <select
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Todos los niveles</option>
          <option value="ALTO">Alto</option>
          <option value="MEDIO">Medio</option>
          <option value="BAJO">Bajo</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredAlertas.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay alertas con los filtros actuales</p>
            </div>
          ) : (
            filteredAlertas.map((alerta) => (
              <AlertaCard
                key={alerta.id}
                alerta={alerta}
                isSelected={selectedAlerta?.id === alerta.id}
                onSelect={() => setSelectedAlerta(alerta)}
              />
            ))
          )}
        </div>

        {/* Alert Detail */}
        <div className="lg:col-span-1">
          {selectedAlerta ? (
            <div className="bg-card rounded-xl p-6 border space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Detalle de Alerta</h3>
                <button
                  onClick={() => setSelectedAlerta(null)}
                  className="p-1 hover:bg-accent rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Usuario</p>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-primary" />
                    <p className="font-medium">{selectedAlerta.usuario?.nombre}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Grado</p>
                  <p className="font-medium">{selectedAlerta.usuario?.grado}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedAlerta.tipo}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Nivel de Riesgo</p>
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-white ${getRiskColor(selectedAlerta.nivelRiesgo)}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">{selectedAlerta.nivelRiesgo}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getEstadoColor(selectedAlerta.estado)}`}>
                    <span className="font-medium">{selectedAlerta.estado}</span>
                  </span>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{new Date(selectedAlerta.timestamp).toLocaleString('es-ES')}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Extracto</p>
                  <p className="text-sm bg-secondary p-2 rounded">{selectedAlerta.extracto}</p>
                </div>

                {selectedAlerta.notas && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas anteriores</p>
                    <p className="text-sm bg-secondary p-2 rounded">{selectedAlerta.notas}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-2">Nuevas notas</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Añade notas sobre esta alerta..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateAlertaEstado('ATENDIDA')}
                    disabled={isUpdating}
                    className="flex items-center justify-center space-x-2 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Atendida</span>
                  </button>
                  <button
                    onClick={() => updateAlertaEstado('EN_SEGUIMIENTO')}
                    disabled={isUpdating}
                    className="flex items-center justify-center space-x-2 p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Seguimiento</span>
                  </button>
                  <button
                    onClick={() => updateAlertaEstado('DERIVADA')}
                    disabled={isUpdating}
                    className="flex items-center justify-center space-x-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Derivar</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button className="flex items-center justify-center space-x-2 p-2 bg-secondary rounded-lg hover:bg-accent transition-colors">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 p-2 bg-secondary rounded-lg hover:bg-accent transition-colors">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">Llamar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl p-6 border text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Selecciona una alerta para ver el detalle
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, bgColor }: any) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function AlertaCard({ alerta, isSelected, onSelect }: any) {
  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'ALTO': return 'bg-red-500';
      case 'MEDIO': return 'bg-yellow-500';
      case 'BAJO': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-red-100 text-red-700';
      case 'ATENDIDA': return 'bg-green-100 text-green-700';
      case 'EN_SEGUIMIENTO': return 'bg-yellow-100 text-yellow-700';
      case 'DERIVADA': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-card rounded-xl p-4 border cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'border-primary ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`h-10 w-10 rounded-full ${getRiskColor(alerta.nivelRiesgo)} flex items-center justify-center text-white`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{alerta.usuario?.nombre}</p>
            <p className="text-xs text-muted-foreground">{alerta.usuario?.grado}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(alerta.estado)}`}>
          {alerta.estado}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tipo:</span>
          <span className="font-medium">{alerta.tipo}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Riesgo:</span>
          <span className={`font-medium ${alerta.nivelRiesgo === 'ALTO' ? 'text-red-500' : ''}`}>
            {alerta.nivelRiesgo}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fecha:</span>
          <span className="font-medium">
            {new Date(alerta.timestamp).toLocaleDateString('es-ES')}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <p className="text-xs text-muted-foreground line-clamp-2">{alerta.extracto}</p>
      </div>
    </div>
  );
}
