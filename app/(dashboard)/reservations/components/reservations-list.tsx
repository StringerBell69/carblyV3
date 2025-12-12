'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Plus,
  Calendar,
  User,
  Car,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
} from 'lucide-react';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, order: number }> = {
  in_progress: { variant: 'default', label: 'En cours', order: 1 },
  confirmed: { variant: 'default', label: 'Confirmé', order: 2 },
  paid: { variant: 'default', label: 'Payé', order: 3 },
  pending_payment: { variant: 'outline', label: 'En attente', order: 4 },
  draft: { variant: 'secondary', label: 'Brouillon', order: 5 },
  completed: { variant: 'secondary', label: 'Terminé', order: 6 },
  cancelled: { variant: 'destructive', label: 'Annulé', order: 7 },
};

type SortField = 'date' | 'amount' | 'status' | 'vehicle' | 'customer';
type SortDirection = 'asc' | 'desc';

interface Reservation {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date;
  totalAmount: string;
  createdAt: Date;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    plate: string;
  };
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface ReservationsListProps {
  reservations: Reservation[];
}

export function ReservationsList({ reservations }: ReservationsListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Get unique vehicles for filter
  const uniqueVehicles = useMemo(() => {
    const vehicles = new Map<string, { id: string; name: string }>();
    reservations.forEach(r => {
      if (!vehicles.has(r.vehicle.id)) {
        vehicles.set(r.vehicle.id, {
          id: r.vehicle.id,
          name: `${r.vehicle.brand} ${r.vehicle.model}`,
        });
      }
    });
    return Array.from(vehicles.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [reservations]);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    reservations.forEach(r => statuses.add(r.status));
    return Array.from(statuses).sort((a, b) => 
      (statusConfig[a]?.order || 99) - (statusConfig[b]?.order || 99)
    );
  }, [reservations]);

  // Filter and sort reservations
  const filteredAndSortedReservations = useMemo(() => {
    let filtered = [...reservations];

    // Apply vehicle filter
    if (filterVehicle !== 'all') {
      filtered = filtered.filter(r => r.vehicle.id === filterVehicle);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'amount':
          comparison = parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
          break;
        case 'status':
          comparison = (statusConfig[a.status]?.order || 99) - (statusConfig[b.status]?.order || 99);
          break;
        case 'vehicle':
          comparison = `${a.vehicle.brand} ${a.vehicle.model}`.localeCompare(`${b.vehicle.brand} ${b.vehicle.model}`);
          break;
        case 'customer':
          const nameA = `${a.customer?.firstName || ''} ${a.customer?.lastName || ''}`.trim();
          const nameB = `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim();
          comparison = nameA.localeCompare(nameB);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [reservations, sortField, sortDirection, filterVehicle, filterStatus]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setFilterVehicle('all');
    setFilterStatus('all');
  };

  const hasActiveFilters = filterVehicle !== 'all' || filterStatus !== 'all';

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 sm:py-12">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4 sm:p-6">
                <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucune réservation</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 px-4">
              Commencez par créer votre première réservation
            </p>
            <Link href="/reservations/new">
              <Button className="h-11">
                <Plus className="mr-2 h-4 w-4" />
                Créer une réservation
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters & Sort Row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtres:</span>
        </div>

        {/* Vehicle Filter */}
        <Select value={filterVehicle} onValueChange={setFilterVehicle}>
          <SelectTrigger className="w-[140px] sm:w-[160px] h-9">
            <Car className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            <SelectValue placeholder="Véhicule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les véhicules</SelectItem>
            {uniqueVehicles.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] sm:w-[150px] h-9">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status}>
                {statusConfig[status]?.label || status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-9 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}

        {/* Results count */}
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredAndSortedReservations.length} / {reservations.length}
        </div>

        {/* Mobile Sort Selector */}
        
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">
                <button 
                  onClick={() => toggleSort('vehicle')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Car className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Véhicule</span>
                  <SortIcon field="vehicle" />
                </button>
              </TableHead>
              <TableHead className="min-w-[100px]">
                <button 
                  onClick={() => toggleSort('customer')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Client</span>
                  <SortIcon field="customer" />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <button 
                  onClick={() => toggleSort('date')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Période
                  <SortIcon field="date" />
                </button>
              </TableHead>
              <TableHead className="text-right min-w-[80px]">
                <button 
                  onClick={() => toggleSort('amount')}
                  className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
                >
                  Montant
                  <SortIcon field="amount" />
                </button>
              </TableHead>
              <TableHead className="min-w-[90px]">
                <button 
                  onClick={() => toggleSort('status')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Statut
                  <SortIcon field="status" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedReservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Aucune réservation ne correspond aux filtres.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedReservations.map((reservation) => (
                <TableRow key={reservation.id} className="group">
                  <TableCell className="font-medium py-3">
                    <Link 
                      href={`/reservations/${reservation.id}`}
                      className="block hover:text-primary transition-colors"
                    >
                      <div className="font-semibold text-sm">
                        {reservation.vehicle.brand} {reservation.vehicle.model}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {reservation.vehicle.plate}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="py-3">
                    <Link 
                      href={`/reservations/${reservation.id}`}
                      className="block hover:text-primary transition-colors text-sm"
                    >
                      {reservation.customer?.firstName} {reservation.customer?.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3">
                    <Link 
                      href={`/reservations/${reservation.id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <Link 
                      href={`/reservations/${reservation.id}`}
                      className="block font-semibold text-sm hover:text-primary transition-colors"
                    >
                      {formatCurrency(parseFloat(reservation.totalAmount))}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3">
                    <Link href={`/reservations/${reservation.id}`}>
                      <Badge variant={statusConfig[reservation.status]?.variant || 'outline'} className="text-xs">
                        {statusConfig[reservation.status]?.label || reservation.status}
                      </Badge>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
