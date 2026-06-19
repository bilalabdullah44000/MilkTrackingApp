import { gql } from '@apollo/client';

export const CREATE_VENDOR = gql`
  mutation CreateVendor($input: CreateVendorInput!) {
    createVendor(input: $input) {
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

export const UPDATE_VENDOR = gql`
  mutation UpdateVendor($id: ID!, $input: CreateVendorInput!) {
    updateVendor(id: $id, input: $input) {
      id
      name
      defaultRate
      active
      notes
      updatedAt
    }
  }
`;

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
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

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CreateCustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      defaultRate
      active
      notes
      updatedAt
    }
  }
`;

export const ADD_PURCHASE = gql`
  mutation AddMilkPurchase($input: AddPurchaseInput!) {
    addMilkPurchase(input: $input) {
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
    }
  }
`;

export const UPDATE_PURCHASE = gql`
  mutation UpdateMilkPurchase($id: ID!, $input: AddPurchaseInput!) {
    updateMilkPurchase(id: $id, input: $input) {
      id
      purchaseDate
      quantityLiters
      ratePerLiter
      totalAmount
    }
  }
`;

export const ADD_DELIVERY = gql`
  mutation AddMilkDelivery($input: AddDeliveryInput!) {
    addMilkDelivery(input: $input) {
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
    }
  }
`;

export const UPDATE_DELIVERY = gql`
  mutation UpdateMilkDelivery($id: ID!, $input: AddDeliveryInput!) {
    updateMilkDelivery(id: $id, input: $input) {
      id
      deliveryDate
      quantityLiters
      ratePerLiter
      totalAmount
    }
  }
`;

export const DELETE_PURCHASE = gql`
  mutation DeleteMilkPurchase($id: ID!) {
    deleteMilkPurchase(id: $id)
  }
`;

export const DELETE_DELIVERY = gql`
  mutation DeleteMilkDelivery($id: ID!) {
    deleteMilkDelivery(id: $id)
  }
`;

export const ADD_BULK_DELIVERIES = gql`
  mutation AddBulkMilkDeliveries($input: [BulkDeliveryItemInput!]!) {
    addBulkMilkDeliveries(input: $input) {
      successCount
      failedCount
      createdDeliveries {
        id
        customer {
          id
          name
        }
        deliveryDate
        quantityLiters
        totalAmount
      }
      errors {
        customerId
        customerName
        reason
      }
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      fullName
      email
      role
      active
    }
  }
`;

export const UPDATE_ALL_CUSTOMERS_RATE = gql`
  mutation UpdateAllCustomersRate($defaultRate: Float!) {
    updateAllCustomersRate(defaultRate: $defaultRate)
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      fullName
      role
      active
    }
  }
`;
