'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Search,
  CheckCircle2,
  Award,
  ChevronRight,
} from 'lucide-react';

type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  identityVerified: boolean;
  loyaltyPoints: number;
  createdAt: Date;
  reservationCount: number;
};

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(query) ||
      customer.lastName?.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    );
  });

  const handleViewDetails = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher un client..."
          className="pl-9 h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Mobile Card List */}
      <div className="space-y-2 md:hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="active:scale-[0.99] transition-transform cursor-pointer"
              onClick={() => handleViewDetails(customer.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold truncate">
                        {customer.firstName} {customer.lastName}
                      </p>
                      {customer.identityVerified && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {customer.email}
                    </p>
                    {customer.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {customer.reservationCount} résa
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Award className="h-3 w-3" />
                      {customer.loyaltyPoints}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Réservations</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-center hidden lg:table-cell">Points</TableHead>
              <TableHead className="hidden lg:table-cell">Inscrit le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(customer.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-semibold">
                      {customer.reservationCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {customer.identityVerified ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Vérifié
                      </Badge>
                    ) : (
                      <Badge variant="outline">Non vérifié</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1 text-sm font-medium">
                      <Award className="h-4 w-4 text-amber-500" />
                      {customer.loyaltyPoints}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(customer.createdAt)}
                    </div>
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
