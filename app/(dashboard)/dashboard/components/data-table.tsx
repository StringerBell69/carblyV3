"use client"

import * as React from "react"
import {
  IconCircleCheckFilled,
  IconClock,
  IconLoader,
  IconLayoutColumns,
  IconChevronDown,
  IconDotsVertical,
} from "@tabler/icons-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Reservation {
  id: string
  customer: {
    firstName: string | null
    lastName: string | null
  }
  vehicle: {
    brand: string
    model: string
  }
  status: string
  startDate: string
  endDate: string
  totalAmount: string
}

interface DataTableProps {
  data: Reservation[]
}

const statusIcons: Record<string, React.ReactNode> = {
  confirmed: <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />,
  paid: <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />,
  completed: <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />,
  in_progress: <IconClock className="text-blue-500" />,
  pending_payment: <IconClock className="text-orange-500" />,
  draft: <IconLoader className="text-gray-400" />,
  cancelled: <IconLoader className="text-red-500" />,
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  pending_payment: 'Paiement en attente',
  paid: 'Payé',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

export function DataTable({ data }: DataTableProps) {
  const [currentView, setCurrentView] = React.useState("all")

  const filteredData = React.useMemo(() => {
    if (currentView === "active") {
      return data.filter(r => ['confirmed', 'in_progress', 'paid'].includes(r.status))
    }
    if (currentView === "upcoming") {
      return data.filter(r => ['confirmed', 'paid'].includes(r.status))
    }
    if (currentView === "completed") {
      return data.filter(r => r.status === 'completed')
    }
    return data
  }, [data, currentView])

  return (
    <Tabs
      defaultValue="all"
      value={currentView}
      onValueChange={setCurrentView}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          Vue
        </Label>
        <Select value={currentView} onValueChange={setCurrentView}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            id="view-selector"
          >
            <SelectValue placeholder="Sélectionner une vue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les réservations</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="upcoming">À venir</SelectItem>
            <SelectItem value="completed">Terminées</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">Toutes les réservations</TabsTrigger>
          <TabsTrigger value="active">
            Actives <Badge variant="secondary">{data.filter(r => ['confirmed', 'in_progress', 'paid'].includes(r.status)).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            À venir <Badge variant="secondary">{data.filter(r => ['confirmed', 'paid'].includes(r.status)).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value={currentView}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date de début</TableHead>
                <TableHead>Date de fin</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <Link
                        href={`/reservations/${reservation.id}`}
                        className="font-medium hover:underline"
                      >
                        {reservation.customer.firstName} {reservation.customer.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {reservation.vehicle.brand} {reservation.vehicle.model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-muted-foreground px-1.5">
                        {statusIcons[reservation.status]}
                        {statusLabels[reservation.status] || reservation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(new Date(reservation.startDate))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(new Date(reservation.endDate))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(parseFloat(reservation.totalAmount))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                            size="icon"
                          >
                            <IconDotsVertical />
                            <span className="sr-only">Ouvrir le menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem asChild>
                            <Link href={`/reservations/${reservation.id}`}>Voir</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/reservations/${reservation.id}`}>Modifier</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">Annuler</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Aucune réservation trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground flex-1 text-sm">
            Affichage de {filteredData.length} sur {data.length} réservation{data.length !== 1 ? 's' : ''}.
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
