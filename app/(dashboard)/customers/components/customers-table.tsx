'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  MoreHorizontal,
  Search,
  CheckCircle2,
  Award,
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

  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un client..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-center">Réservations</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            <TableHead className="text-center">Points</TableHead>
            <TableHead>Inscrit le</TableHead>
            {/* <TableHead className="text-right">Actions</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCustomers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
              </TableCell>
            </TableRow>
          ) : (
            filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
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
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-medium">
                    <Award className="h-4 w-4 text-amber-500" />
                    {customer.loyaltyPoints}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(customer.createdAt)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                 {/*  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewDetails(customer.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendEmail(customer.email)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Envoyer un email
                      </DropdownMenuItem>
                    </DropdownMenuContent> 
                  </DropdownMenu>*/}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
