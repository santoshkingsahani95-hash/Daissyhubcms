export type UserRole = "admin" | "staff" | "superadmin";

export type PermissionKey =
  | "dashboard:view"
  | "parcels:create"
  | "parcels:edit"
  | "parcels:delete"
  | "parcels:import"
  | "batches:manage"
  | "delivery:update"
  | "returns:manage"
  | "couriers:manage"
  | "settlements:view"
  | "settlements:manage"
  | "payments:manage"
  | "ledger:view"
  | "reports:view"
  | "reports:export"
  | "users:manage"
  | "settings:manage"
  | "customers:view"
  | "customers:manage";

export interface IUser {
  _id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  permissions: PermissionKey[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryArea = "Inside Valley" | "Outside Valley" | string;

export type ParcelStatus =
  | "With Courier"
  | "Delivered"
  | "Delivery Attempt Failed"
  | "Return Initiated"
  | "Returned to Warehouse"
  | "Pending Verification"
  // Backwards compatibility aliases
  | "Booked"
  | "Pickup Pending"
  | "Picked Up"
  | "In Transit"
  | "Arrived at Destination Hub"
  | "Out for Delivery"
  | "Delivery Failed"
  | "Returned"
  | "Cancelled";

export type FailureReason =
  | "Customer did not answer"
  | "Wrong phone number"
  | "Customer rejected parcel"
  | "Customer unavailable"
  | "Address not found"
  | "Other";

export interface ICourierCompany {
  _id: string;
  name: string;
  code?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  email?: string;
  isActive: boolean;
  serviceArea?: string;
  defaultDeliveryCharge: number;
  defaultChargeInsideValley?: number;
  defaultChargeOutsideValley?: number;
  returnChargeInsideValley?: number;
  returnChargeOutsideValley?: number;
  openingBalance?: number;
  currentBalance?: number;
  totalParcelsDispatched?: number;
  totalDelivered?: number;
  totalReturned?: number;
  totalCodCollected?: number;
  settlementType?: "deduct_from_cod" | "separate";
  apiIntegrationStatus?: "none" | "active" | "inactive" | "testing";
  apiConfig?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  deliveryArea?: DeliveryArea;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  totalCodAmount: number;
  totalAdvancePaid?: number;
  firstOrderDate: string;
  lastOrderDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStatusHistoryItem {
  previousStatus?: ParcelStatus | string;
  newStatus?: ParcelStatus | string;
  status?: ParcelStatus | string;
  timestamp: string;
  updatedBy: string;
  reason?: string;
  remarks?: string;
  location?: string;
}

export interface IParcel {
  _id: string;
  parcelId: string;
  orderId?: string;
  batchId: string;
  batchRef?: string;
  courierId: string;
  courierName: string;
  customer?: string | ICustomer;
  customerName: string;
  customerPhone: string;
  codAmount: number;
  advancePayment?: number;
  totalOrderValue?: number;
  itemSku: string;
  quantity?: number;
  deliveryArea?: DeliveryArea;
  deliveryCharge: number;
  courierCharge?: number;
  customerAddress: string;
  remarks?: string;
  status: ParcelStatus;
  dispatchDate: string;
  bookingDate?: string;
  deliveredDate?: string;
  returnDate?: string;
  returnReason?: string;
  returnedProcessedBy?: string;
  failureReason?: FailureReason | string;
  externalTrackingId?: string;
  statusHistory: IStatusHistoryItem[];
  trackingHistory?: IStatusHistoryItem[];
  isSettled: boolean;
  settlementId?: string;
  settlementNumber?: string;
  settlementDate?: string;
  createdBy?: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IBatch {
  _id: string;
  batchId: string;
  courierId: string;
  courierName: string;
  dispatchDate: string;
  serviceArea?: string;
  notes?: string;
  totalParcels: number;
  totalCodAmount: number;
  totalAdvancePaid?: number;
  totalDeliveryCharges: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
  pendingCount: number;
  status: "Active" | "Closed" | "Settled";
  createdBy?: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IReturnRecord {
  _id: string;
  returnId: string;
  parcelId: string;
  batchId: string;
  courierId: string;
  courierName: string;
  customerName: string;
  customerPhone: string;
  codAmount: number;
  itemSku: string;
  customerAddress: string;
  deliveryCharge: number;
  returnCharge: number;
  returnReason: string;
  returnDate: string;
  processedBy: string;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod =
  | "Bank Transfer"
  | "Cash"
  | "Split (Cash + Online)"
  | "Cheque"
  | "Digital Wallet"
  | "Esewa"
  | "Khalti"
  | "ConnectIPS"
  | "Other";

export interface PaymentInstallment {
  _id?: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  cashAmount: number;
  onlineAmount: number;
  paymentMethod: string;
  referenceNumber?: string;
  remarks?: string;
  recordedBy: string;
  recordedAt?: string;
}

export interface ISettlement {
  _id: string;
  settlementId?: string;
  settlementNumber: string;
  settlementDate: string;
  transactionDate?: string;
  transactionType?: string;
  amount?: number;
  courierId: string;
  courierName: string;
  serviceArea: string;
  startDate: string;
  endDate: string;
  deliveredParcelsCount: number;
  returnedParcelsCount: number;
  totalProcessedCount: number;
  grossCodCollection: number;
  totalAdvancePaid?: number;
  totalOrderValue?: number;
  deliveryCharges: number;
  returnCharges: number;
  currentNetReceivable: number;
  previousOutstandingDue: number;
  totalReceivable: number;
  paymentReceived: number;
  remainingDue: number;
  paymentStatus?: "Unpaid" | "Partially Paid" | "Fully Paid";
  cashReceived?: number;
  onlineReceived?: number;
  paymentInstallments?: PaymentInstallment[];
  paymentMethod: PaymentMethod;
  paymentReference: string;
  referenceNumber?: string;
  notes?: string;
  remarks?: string;
  settledParcels: string[];
  status: "Draft" | "Finalized" | "Reversed";
  preparedBy: string;
  authorizedBy: string;
  courierRepName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  paymentNumber: string;
  courierId: string;
  courierName: string;
  settlementId?: string;
  settlementNumber?: string;
  amount: number;
  cashAmount?: number;
  onlineAmount?: number;
  onlineMethod?: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receiptUrl?: string;
  remarks?: string;
  recordedBy: string;
  createdAt: string;
}

export type LedgerTransactionType =
  | "Opening Balance"
  | "Delivered COD"
  | "Delivery Charge"
  | "Return Charge"
  | "Payment Received"
  | "Settlement"
  | "Adjustment";

export interface ICourierLedgerEntry {
  _id: string;
  ledgerId: string;
  courierId: string;
  courierName: string;
  transactionDate: string;
  transactionType: LedgerTransactionType;
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  createdBy: string;
  createdAt: string;
}

export interface ICompanySettings {
  companyName: string;
  panVatNumber: string;
  corporateAddress: string;
  phones: string;
  email: string;
  signatoryNameTitle: string;
  billFooterNotice: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  defaultChargeInsideValley: number;
  defaultChargeOutsideValley: number;
  defaultReturnChargeInsideValley: number;
  defaultReturnChargeOutsideValley: number;
  businessName?: string;
  address?: string;
  phone?: string;
}

export interface IActivityLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    role: string;
    username: string;
  };
  action: string;
  details: string;
  relatedRecordId?: string;
  ipAddress?: string;
  createdAt: string;
}
