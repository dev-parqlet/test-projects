"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GuestBookingRequest,
  createGuestBooking,
  getAvailableParkingSpots,
  bookingKeys,
  ParkingSpot,
} from "@/lib/api/bookings";
import { VehicleType } from "./icons";
import { useAuth } from "@/components/auth/auth-provider";
import { useWindowWidth } from "@/components/hooks/useWindowSize";
import { useBuildingFilter } from "@/components/context/building-filter-context";
import {
  VEHICLE_ICONS,
  IcEVCharge,
  IcCloseSm,
  IcCheckSm,
  IcCalendarSm,
  IcClockSm,
} from "./icons";

// ─── Constants ──────────────────────────────────────────────────────────

const VEHICLE_TYPES: VehicleType[] = ["Compact", "Standard", "Large SUV", "Motorcycle"];
const CREDIT_COST = 50;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  const minStr = m > 0 ? `:${m.toString().padStart(2, "0")}` : "";
  const mon = MONTHS_SHORT[date.getMonth()];
  const day = date.getDate();
  return `${hour12}${minStr}${ampm}, ${mon} ${day}`;
}

// ─── Step labels ─────────────────────────────────────────────────────────

const STEPS = [
  "Vehicle Type",
  "EV Charging",
  "Date & Time",
  "Guest Details",
  "Liability",
  "Confirmation",
];

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "var(--font-size-extra-tiny)",
  color: "var(--color-text-weak)",
  lineHeight: "var(--line-height-extra-tiny)",
  fontFamily: "var(--font-family-body)",
  fontWeight: 400,
  display: "block",
  marginBottom: "var(--spacing-4)",
};

// ─── Props ───────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────

export function GuestRentalModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const { selectedIds } = useBuildingFilter();
  const queryClient = useQueryClient();
  const isMobile = useWindowWidth() < 480;

  // ── Form state ────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [evCharge, setEvCharge] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("08");
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState("12");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [liabilityAck, setLiabilityAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [availableSpots, setAvailableSpots] = useState<ParkingSpot[]>([]);
  const [checkingSpots, setCheckingSpots] = useState(false);
  const [confirmation, setConfirmation] = useState<{ spot: string; bookingId: string } | null>(null);

  const buildingId = selectedIds[0] ?? user?.buildingIds?.[0] ?? "";

  // Pre-fill resident info from auth
  const residentName = user?.name ?? "";
  const residentPhone = user?.phone ?? "";

  // ── Derived values ────────────────────────────────────────────────────

  const formattedStart = startDate && startTime
    ? formatDate(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), parseInt(startTime), 0))
    : "";
  const formattedEnd = endDate && endTime
    ? formatDate(new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), parseInt(endTime), 0))
    : "";

  const isDateRangeValid = startDate && endDate && formattedEnd && formattedStart;
  const dateRangeConflict = startDate && endDate && endDate <= startDate;

  // ── Field validators ─────────────────────────────────────────────────
  function isValidFullName(name: string): boolean {
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);
    return parts.length >= 2 && parts.every(p => p.length >= 2);
  }

  function isValidUSPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    return /^\+?1?\d{10}$/.test(cleaned);
  }

  function validateFields(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!licensePlate.trim()) errors.licensePlate = "License plate is required";
    if (!vehicleMake.trim()) errors.vehicleMake = "Vehicle make is required";
    if (!vehicleColor.trim()) errors.vehicleColor = "Vehicle color is required";
    if (!guestName.trim()) errors.guestName = "Guest name is required";
    else if (!isValidFullName(guestName)) errors.guestName = "Enter a full first and last name";
    if (!guestPhone.trim()) errors.guestPhone = "Guest phone is required";
    else if (!isValidUSPhone(guestPhone)) errors.guestPhone = "Enter a valid US phone number (e.g. +1 (555) 000-0000)";
    return errors;
  }

  // ── Validation per step ───────────────────────────────────────────────
  function canProceed(): boolean {
    switch (step) {
      case 0: return vehicleType !== null;
      case 1: return true;
      case 2: return !!startDate && !!endDate && !dateRangeConflict;
      case 3: {
        const errors = validateFields();
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
      }
      case 4: return liabilityAck;
      default: return true;
    }
  }

  // ── Check spot availability when proceeding from date step ────────────
  async function checkAvailability() {
    if (!vehicleType || !isDateRangeValid) return false;
    setCheckingSpots(true);
    setError(null);
    try {
      const result = await getAvailableParkingSpots({
        buildingId,
        vehicleType,
        evCharge,
        startDate: formattedStart,
        endDate: formattedEnd,
      });
      setAvailableSpots(result.data);
      if (result.total === 0) {
        setError("No available parking spots match your criteria. Try a different date or vehicle type.");
        return false;
      }
      return true;
    } catch {
      setError("Failed to check availability. Please try again.");
      return false;
    } finally {
      setCheckingSpots(false);
    }
  }

  // ── Submit mutation ──────────────────────────────────────────────────
  const createBooking = useMutation({
    mutationFn: () => {
      if (!vehicleType || !isDateRangeValid || availableSpots.length === 0) {
        return Promise.reject(new Error("Missing required fields or no spot available"));
      }
      const data: GuestBookingRequest = {
        buildingId,
        unit: user?.unit ?? "",
        residentName,
        residentPhone,
        vehicleType,
        evCharge,
        bookingStart: formattedStart,
        bookingEnd: formattedEnd,
        licensePlate: licensePlate.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleColor: vehicleColor.trim(),
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestLiabilityAck: liabilityAck,
      };
      return createGuestBooking(data);
    },
    onSuccess: (booking) => {
      setConfirmation({ spot: booking.spot, bookingId: booking.id });
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    },
  });

  // ── Navigation ────────────────────────────────────────────────────────
  async function handleNext() {
    setError(null);
    if (step === 2) {
      const ok = await checkAvailability();
      if (!ok) return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    setError(null);
    if (step > 0) setStep(step - 1);
  }

  function handleConfirm() {
    createBooking.mutate();
  }

  // ── Render helpers ────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    border: "1px solid var(--color-stroke-medium)",
    borderRadius: "var(--radius-8)",
    padding: "0 var(--spacing-12)",
    fontSize: "var(--font-size-tiny)",
    color: "var(--color-text-strong)",
    background: "var(--color-fill-white)",
    fontFamily: "var(--font-family-body)",
    outline: "none",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "auto",
  };

  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    height: 40,
    padding: "0 var(--spacing-24)",
    background: disabled ? "var(--color-gray-30)" : "var(--color-fill-strong)",
    color: disabled ? "var(--color-text-disabled)" : "var(--color-text-white)",
    border: "none",
    borderRadius: "var(--radius-48)",
    fontSize: "var(--font-size-tiny)",
    fontWeight: 500,
    fontFamily: "var(--font-family-body)",
    cursor: disabled ? "default" : "pointer",
    transition: "background 0.15s, color 0.15s",
  });

  const divider: React.CSSProperties = {
    borderBottom: "1px solid var(--color-stroke-medium)",
    margin: "var(--spacing-16) 0",
  };

  // ── Step Renderers ────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      // ── Step 0: Vehicle Type ─────────────────────────────────────────
      case 0:
        return (
          <div>
            <span style={LABEL_STYLE}>Select vehicle type</span>
            <div style={{ display: "flex", gap: "var(--spacing-8)", flexWrap: "wrap", marginTop: "var(--spacing-8)" }}>
              {VEHICLE_TYPES.map((vt) => {
                const Icon = VEHICLE_ICONS[vt];
                const selected = vehicleType === vt;
                return (
                  <button
                    key={vt}
                    onClick={() => setVehicleType(vt)}
                    style={{
                      flex: "1 0 calc(50% - 4px)",
                      minWidth: 140,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "var(--spacing-8)",
                      padding: "var(--spacing-16)",
                      border: selected ? "2px solid var(--color-fill-strong)" : "1px solid var(--color-stroke-medium)",
                      borderRadius: "var(--radius-12)",
                      background: selected ? "var(--color-gray-5)" : "var(--color-fill-white)",
                      cursor: "pointer",
                      fontFamily: "var(--font-family-body)",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <Icon color={selected ? "var(--color-fill-strong)" : "var(--color-icon-weak)"} />
                    <span style={{
                      fontSize: "var(--font-size-tiny)",
                      fontWeight: selected ? 500 : 400,
                      color: selected ? "var(--color-text-strong)" : "var(--color-text-weak)",
                    }}>
                      {vt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ── Step 1: EV Charging ──────────────────────────────────────────
      case 1:
        return (
          <div>
            <span style={LABEL_STYLE}>Does the guest need an EV charging spot?</span>
            <div style={{ display: "flex", gap: "var(--spacing-12)", marginTop: "var(--spacing-12)" }}>
              <button
                onClick={() => setEvCharge(true)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--spacing-8)",
                  padding: "var(--spacing-16)",
                  border: evCharge ? "2px solid var(--color-fill-strong)" : "1px solid var(--color-stroke-medium)",
                  borderRadius: "var(--radius-12)",
                  background: evCharge ? "var(--color-gray-5)" : "var(--color-fill-white)",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-body)",
                  transition: "border-color 0.15s",
                }}
              >
                <IcEVCharge color={evCharge ? "var(--color-fill-strong)" : "var(--color-icon-weak)"} />
                <span style={{
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: evCharge ? 500 : 400,
                  color: evCharge ? "var(--color-text-strong)" : "var(--color-text-weak)",
                }}>
                  Yes, needs EV charging
                </span>
              </button>
              <button
                onClick={() => setEvCharge(false)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--spacing-8)",
                  padding: "var(--spacing-16)",
                  border: !evCharge ? "2px solid var(--color-fill-strong)" : "1px solid var(--color-stroke-medium)",
                  borderRadius: "var(--radius-12)",
                  background: !evCharge ? "var(--color-gray-5)" : "var(--color-fill-white)",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-body)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4l12 12" stroke={!evCharge ? "var(--color-fill-strong)" : "var(--color-icon-weak)"} strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="7" y="1" width="6" height="7" rx="1" stroke={!evCharge ? "var(--color-fill-strong)" : "var(--color-icon-weak)"} strokeWidth="1.2" />
                  <path d="M10 8v5" stroke={!evCharge ? "var(--color-fill-strong)" : "var(--color-icon-weak)"} strokeWidth="1.2" />
                  <path d="M8 13h4l-2 4v3l4-5" stroke={!evCharge ? "var(--color-fill-strong)" : "var(--color-icon-weak)"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{
                  fontSize: "var(--font-size-tiny)",
                  fontWeight: !evCharge ? 500 : 400,
                  color: !evCharge ? "var(--color-text-strong)" : "var(--color-text-weak)",
                }}>
                  No EV charging needed
                </span>
              </button>
            </div>
          </div>
        );

      // ── Step 2: Date & Time ──────────────────────────────────────────
      case 2:
        return (
          <div>
            <span style={LABEL_STYLE}>Select date and time range</span>

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "var(--spacing-16)", marginTop: "var(--spacing-12)" }}>
              {/* Start */}
              <div style={{ flex: 1 }}>
                <span style={{ ...LABEL_STYLE, marginBottom: "var(--spacing-8)" }}>
                  <IcCalendarSm /> Start date
                </span>
                <input
                  type="date"
                  value={startDate ? startDate.toISOString().split("T")[0] : ""}
                  onChange={(e) => {
                    const d = e.target.value ? new Date(e.target.value + "T00:00:00") : null;
                    setStartDate(d);
                  }}
                  style={inputStyle}
                />
                <div style={{ marginTop: "var(--spacing-8)" }}>
                  <span style={{ ...LABEL_STYLE, marginBottom: "var(--spacing-4)" }}>
                    <IcClockSm /> Start time
                  </span>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={selectStyle}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const h = i.toString().padStart(2, "0");
                      const ampm = i >= 12 ? "pm" : "am";
                      const h12 = i % 12 || 12;
                      return <option key={i} value={h}>{h12}{ampm}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* End */}
              <div style={{ flex: 1 }}>
                <span style={{ ...LABEL_STYLE, marginBottom: "var(--spacing-8)" }}>
                  <IcCalendarSm /> End date
                </span>
                <input
                  type="date"
                  value={endDate ? endDate.toISOString().split("T")[0] : ""}
                  onChange={(e) => {
                    const d = e.target.value ? new Date(e.target.value + "T00:00:00") : null;
                    setEndDate(d);
                  }}
                  style={inputStyle}
                />
                <div style={{ marginTop: "var(--spacing-8)" }}>
                  <span style={{ ...LABEL_STYLE, marginBottom: "var(--spacing-4)" }}>
                    <IcClockSm /> End time
                  </span>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={selectStyle}
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const h = i.toString().padStart(2, "0");
                      const ampm = i >= 12 ? "pm" : "am";
                      const h12 = i % 12 || 12;
                      return <option key={i} value={h}>{h12}{ampm}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            {dateRangeConflict && (
              <div style={{
                marginTop: "var(--spacing-8)",
                color: "#ef4444",
                fontSize: "var(--font-size-extra-tiny)",
                fontFamily: "var(--font-family-body)",
              }}>
                End date must be after start date
              </div>
            )}

            {isDateRangeValid && !dateRangeConflict && (
              <div style={{
                marginTop: "var(--spacing-12)",
                padding: "var(--spacing-12)",
                background: "var(--color-gray-5)",
                borderRadius: "var(--radius-8)",
                fontSize: "var(--font-size-tiny)",
                color: "var(--color-text-weak)",
                fontFamily: "var(--font-family-body)",
              }}>
                {formattedStart} → {formattedEnd}
              </div>
            )}
          </div>
        );

      // ── Step 3: Guest Details ────────────────────────────────────────
      case 3:
        return (
          <div>
            <span style={LABEL_STYLE}>Enter guest and vehicle details</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)", marginTop: "var(--spacing-12)" }}>
              <div>
                <span style={LABEL_STYLE}>License plate</span>
                <input
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="e.g. ABC-1234"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "var(--spacing-12)" }}>
                <div style={{ flex: 1 }}>
                  <span style={LABEL_STYLE}>Vehicle make</span>
                  <input
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    placeholder="e.g. Toyota"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={LABEL_STYLE}>Vehicle color</span>
                  <input
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="e.g. White"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <span style={LABEL_STYLE}>Guest name</span>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={LABEL_STYLE}>Guest phone</span>
                <input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        );

      // ── Step 4: Liability Acknowledgement ────────────────────────────
      case 4:
        return (
          <div>
            <span style={LABEL_STYLE}>Liability acknowledgement</span>
            <div style={{
              marginTop: "var(--spacing-12)",
              padding: "var(--spacing-16)",
              background: "var(--color-gray-5)",
              borderRadius: "var(--radius-12)",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-weak)",
              lineHeight: 1.5,
              fontFamily: "var(--font-family-body)",
            }}>
              I acknowledge that the guest vehicle is parked at the owner's risk.
              The HOA, Parqlet, and property management are not responsible for
              any damage, theft, vandalism, or loss that may occur to the vehicle
              or its contents while parked on the premises.
            </div>

            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--spacing-8)",
              marginTop: "var(--spacing-16)",
              cursor: "pointer",
              fontFamily: "var(--font-family-body)",
              fontSize: "var(--font-size-tiny)",
              color: "var(--color-text-strong)",
            }}>
              <input
                type="checkbox"
                checked={liabilityAck}
                onChange={(e) => setLiabilityAck(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              I have read and acknowledge the liability terms above
            </label>
          </div>
        );

      // ── Step 5: Confirmation ──────────────────────────────────────────
      case 5:
        if (!vehicleType) return null;
        return (
          <div>
            {confirmation ? (
              <div>
                {/* Success state */}
                <div style={{
                  textAlign: "center",
                  padding: "var(--spacing-24) 0",
                }}>
                  <div style={{
                    width: 64, height: 64,
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto var(--spacing-16)",
                  }}>
                    <IcCheckSm />
                  </div>
                  <div style={{
                    fontSize: "var(--font-size-body)",
                    fontWeight: 500,
                    color: "var(--color-text-strong)",
                    fontFamily: "var(--font-family-heading)",
                  }}>
                    Booking Confirmed!
                  </div>
                </div>

                <div style={divider} />

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
                  <DetailRow label="Guest" value={guestName} />
                  <DetailRow label="Vehicle" value={`${vehicleMake} (${vehicleColor}) · ${vehicleType} · ${licensePlate}`} />
                  <DetailRow label="EV Charging" value={evCharge ? "Yes" : "No"} />
                  <DetailRow label="Start" value={formattedStart} />
                  <DetailRow label="End" value={formattedEnd} />
                  <DetailRow label="Parking Spot" value={confirmation.spot} highlight />
                  <DetailRow label="Credits Spent" value={`${CREDIT_COST} credits`} />
                </div>

                <div style={{ ...divider, marginTop: "var(--spacing-20)" }} />

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={onClose}
                    style={btnStyle(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Pre-confirmation summary */}
                <span style={LABEL_STYLE}>Review and confirm booking</span>

                <div style={divider} />

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
                  <DetailRow label="Vehicle Type" value={vehicleType} />
                  <DetailRow label="EV Charging" value={evCharge ? "Yes" : "No"} />
                  <DetailRow label="Date Range" value={`${formattedStart} → ${formattedEnd}`} />
                  <DetailRow label="License Plate" value={licensePlate} />
                  <DetailRow label="Vehicle" value={`${vehicleMake} · ${vehicleColor}`} />
                  <DetailRow label="Guest" value={`${guestName} · ${guestPhone}`} />
                  <DetailRow label="Parking Spot" value={availableSpots[0]?.label ?? "Auto-assigned"} highlight />
                  <DetailRow label="Cost" value={`${CREDIT_COST} credits`} />
                </div>

                {error && (
                  <div style={{
                    marginTop: "var(--spacing-12)",
                    color: "#ef4444",
                    fontSize: "var(--font-size-extra-tiny)",
                    fontFamily: "var(--font-family-body)",
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--spacing-20)" }}>
                  <button
                    onClick={handleConfirm}
                    disabled={createBooking.isPending}
                    style={btnStyle(createBooking.isPending)}
                  >
                    {createBooking.isPending ? "Booking..." : "Confirm & Book"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  // ── Main render ──────────────────────────────────────────────────────
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !createBooking.isPending) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "var(--spacing-24)",
      }}
    >
      <div style={{
        background: "var(--color-fill-white)",
        borderRadius: "var(--radius-24)",
        width: "100%",
        maxWidth: 500,
        boxSizing: "border-box",
        maxHeight: "90vh",
        overflowY: "auto",
        position: "relative",
        padding: "var(--spacing-32)",
        fontFamily: "var(--font-family-body)",
      }}>
        {/* Close button */}
        {!confirmation && !createBooking.isPending && (
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "none", border: "none",
              cursor: "pointer", padding: 4,
              display: "flex",
            }}
          >
            <IcCloseSm />
          </button>
        )}

        {/* Title */}
        <div style={{
          fontSize: "var(--font-size-heading-1)",
          fontWeight: 400,
          fontFamily: "var(--font-family-heading)",
          color: "var(--color-text-strong)",
          marginBottom: "var(--spacing-24)",
        }}>
          {confirmation ? "Booking Confirmed" : "Rent Guest Parking"}
        </div>

        {/* Step indicator */}
        {!confirmation && (
          <div style={{
            display: "flex",
            gap: "var(--spacing-4)",
            marginBottom: "var(--spacing-24)",
          }}>
            {STEPS.map((label, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i <= step ? "var(--color-fill-strong)" : "var(--color-gray-30)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        )}

        {/* Current step */}
        {renderStep()}

        {/* Navigation footer */}
        {!confirmation && step < STEPS.length - 1 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "var(--spacing-24)",
          }}>
            <button
              onClick={handleBack}
              disabled={step === 0}
              style={{
                ...btnStyle(false),
                background: "transparent",
                color: "var(--color-text-weak)",
                border: "1px solid var(--color-stroke-medium)",
              }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed() || checkingSpots}
              style={btnStyle(!canProceed() || checkingSpots)}
            >
              {checkingSpots ? "Checking..." : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Row ─────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <span style={{
        fontSize: "var(--font-size-extra-tiny)",
        color: "var(--color-text-weak)",
        fontFamily: "var(--font-family-body)",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: "var(--font-size-tiny)",
        fontWeight: highlight ? 500 : 400,
        color: highlight ? "var(--color-fill-strong)" : "var(--color-text-strong)",
        fontFamily: "var(--font-family-body)",
      }}>
        {value}
      </span>
    </div>
  );
}
