"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";

import { Doctors } from "@/constants";
import { Appointment } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

import { StatusBadge } from "../StatusBadge";

export const columns: ColumnDef<Appointment>[] = [
  {
    header: "#",
    cell: ({ row }) => {
      return <p className="text-14-medium">{row.index + 1}</p>;
    },
  },
  {
    accessorKey: "patient",
    header: "Patient",
    cell: ({ row }) => {
      const appointment = row.original;
      return <p className="text-14-medium">{appointment.patient.firstName} {appointment.patient.lastName}</p>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const appointment = row.original;
      return (
        <div className="min-w-[115px]">
          <StatusBadge status={appointment.status} />
        </div>
      );
    },
  },
  {
    accessorKey: "schedule",
    header: "Appointment",
    cell: ({ row }) => {
      const appointment = row.original;
      return (
        <p className="text-14-regular min-w-[100px]">
          {formatDateTime(appointment.appointmentDate).dateTime}
        </p>
      );
    },
  },
  {
    accessorKey: "primaryPhysician",
    header: "Doctor",
    cell: ({ row }) => {
      const appointment = row.original;
      const doctor = Doctors.find(
        (doctor) => doctor.name === `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
      );
      return (
        <div className="flex items-center gap-3">
          <Image
            src={doctor?.image!}
            alt="doctor"
            width={100}
            height={100}
            className="size-8"
          />
          <p className="whitespace-nowrap">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</p>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="pl-4">Actions</div>,
    cell: ({ row }) => {
      // const appointment = row.original;
      return (
        <div className="flex gap-1">
          <button
            className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
            onClick={() => {
              // Schedule appointment action
              // Handle schedule action here
            }}
          >
            Schedule
          </button>
          <button
            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
            onClick={() => {
              // Cancel appointment action
              // Handle cancel action here
            }}
          >
            Cancel
          </button>
        </div>
      );
    },
  },
];
