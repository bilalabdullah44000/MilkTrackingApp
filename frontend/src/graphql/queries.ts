import { gql } from '@apollo/client';

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($startDate: String!, $endDate: String!) {
    getDashboardStats(startDate: $startDate, endDate: $endDate) {
      milkPurchasedLiters
      milkSuppliedLiters
      revenue
      cost
      profit
    }
  }
`;

export const GET_VENDORS = gql`
  query GetVendors($activeOnly: Boolean) {
    getVendors(activeOnly: $activeOnly) {
      id
      name
      defaultRate
      active
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_CUSTOMERS = gql`
  query GetCustomers($activeOnly: Boolean) {
    getCustomers(activeOnly: $activeOnly) {
      id
      name
      defaultRate
      active
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_PURCHASES = gql`
  query GetPurchases($startDate: String!, $endDate: String!, $vendorIds: [ID!]) {
    getPurchases(startDate: $startDate, endDate: $endDate, vendorIds: $vendorIds) {
      id
      vendor {
        id
        name
      }
      purchaseDate
      quantityLiters
      ratePerLiter
      totalAmount
      notes
      createdAt
    }
  }
`;

export const GET_DELIVERIES = gql`
  query GetDeliveries($startDate: String!, $endDate: String!, $customerIds: [ID!]) {
    getDeliveries(startDate: $startDate, endDate: $endDate, customerIds: $customerIds) {
      id
      customer {
        id
        name
      }
      deliveryDate
      quantityLiters
      ratePerLiter
      totalAmount
      notes
      createdAt
    }
  }
`;

export const GET_PENDING_CUSTOMERS = gql`
  query GetPendingCustomersForDelivery($date: String!) {
    getPendingCustomersForDelivery(date: $date) {
      id
      name
      defaultRate
    }
  }
`;

export const GET_MONTHLY_VENDOR_BILL = gql`
  query GetMonthlyVendorBill($vendorId: ID!, $month: Int!, $year: Int!) {
    getMonthlyVendorBill(vendorId: $vendorId, month: $month, year: $year) {
      entityId
      entityName
      month
      year
      transactions {
        date
        quantityLiters
        ratePerLiter
        amount
      }
      totalLiters
      totalDays
      averageRate
      totalAmount
    }
  }
`;

export const GET_MONTHLY_CUSTOMER_INVOICE = gql`
  query GetMonthlyCustomerInvoice($customerId: ID!, $month: Int!, $year: Int!) {
    getMonthlyCustomerInvoice(customerId: $customerId, month: $month, year: $year) {
      entityId
      entityName
      month
      year
      transactions {
        date
        quantityLiters
        ratePerLiter
        amount
      }
      totalLiters
      totalDays
      averageRate
      totalAmount
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      fullName
      email
      role
      active
      createdAt
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      fullName
      email
      role
      active
    }
  }
`;
