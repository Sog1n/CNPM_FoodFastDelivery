# ERD - Food Fast Delivery System

Date: 11/11/2025
Version: 1.0

This ERD reflects the current backend data models and their relationships inferred from the Mongoose schemas.

## Diagram (Mermaid)
```mermaid
erDiagram
  USER ||--o{ DELIVERY_ADDRESS : has
  USER ||--o{ ORDER : places
  RESTAURANT ||--o{ MENU_ITEM : offers
  RESTAURANT ||--o{ ORDER : receives
  RESTAURANT ||--o{ DRONE : hosts
  PAYMENT ||--|| ORDER : funds
  DELIVERY ||--o{ ORDER : delivers
  DRONE ||--o{ ORDER : assigned_to
  MENU_ITEM ||--o{ ORDER : referenced_by_item

  USER {
    ObjectId _id PK
    string ownerName
    string phone UNIQUE
    string email UNIQUE
    string password
  }

  RESTAURANT {
    ObjectId _id PK
    string restaurantName
    string ownerName
    string phone UNIQUE
    string email UNIQUE
    string city
    string address
    string countryName
    string stateName
    boolean isOpen
    ObjectId[] menu -> MENU_ITEM._id
    ObjectId[] user -> USER._id
  }

  MENU_ITEM {
    ObjectId _id PK
    string dishName
    string description
    number price
    string cuisineName
    string image
    boolean inStock
    ObjectId ownerId FK -> RESTAURANT._id
  }

  DELIVERY {
    ObjectId _id PK
    string ownerName
    string phone UNIQUE
    string email UNIQUE
    string password
    string drivingLicenceNo UNIQUE
    string city
    string address
    string countryName
    string stateName
  }

  DELIVERY_ADDRESS {
    ObjectId _id PK
    ObjectId userId FK -> USER._id
    string country
    string state
    string city
    string address
  }

  PAYMENT {
    ObjectId _id PK
    string orderId
    string ownerId    // user id as string (not ObjectId)
    string paymentId  // gateway payment id
    string signature
    number amount
    string payStatus  // created | paid | failed
    string paymentMethod // Razorpay | VNPay
    string paymentDate
    // additional fields allowed (strict:false)
  }

  ORDER {
    ObjectId _id PK
    ObjectId user       FK -> USER._id
    ObjectId restaurant FK -> RESTAURANT._id
    ObjectId deliveryman FK -> DELIVERY._id (optional)
    ObjectId drone      FK -> DRONE._id (optional)
    ObjectId paymentId  FK UNIQUE -> PAYMENT._id
    ObjectId deliveryAddress FK -> DELIVERY_ADDRESS._id
    string orderStatus  // pending | confirmed | ready | shipping | delivered | cancel
    number totalAmount
    // orderItems: embedded [{ menuItem?: ObjectId -> MENU_ITEM._id, item:{dishName, price}, quantity }]
    date createdAt
    date updatedAt
  }

  DRONE {
    ObjectId _id PK
    string droneId UNIQUE
    string status // AVAILABLE | IN_DELIVERY | MAINTENANCE | OFFLINE
    number batteryLevel (0..100)
    number maxPayload
    ObjectId currentOrder FK -> ORDER._id (optional)
    ObjectId assignedRestaurant FK -> RESTAURANT._id (optional)
    number currentLocation.latitude
    number currentLocation.longitude
    date maintenanceSchedule.lastMaintenance
    date maintenanceSchedule.nextMaintenance
  }
```

## Relationship Notes
- User 1–N DeliveryAddress: a user can store multiple delivery addresses.
- User 1–N Order: a user can place many orders.
- Restaurant 1–N MenuItem: a restaurant offers many menu items. Also, Restaurant has a `menu` array of MenuItem ids.
- Restaurant 1–N Order: orders are placed to a single restaurant.
- Payment 1–1 Order (unique on order.paymentId): every order must reference one unique payment. A payment may exist without a corresponding order until order creation occurs (effective 1–0..1 from Payment to Order).
- Delivery 1–N Order: one delivery partner can deliver many orders over time (order.deliveryman is optional).
- Drone 1–N Order over time: at any moment a drone may have `currentOrder`; historically it can be assigned to many orders (order.drone is optional). Restaurant 1–N Drone via `assignedRestaurant`.
- MenuItem optional reference in Order.orderItems: each order item may reference a specific MenuItem for traceability.

## Field/Schema Anomalies (as-is)
- MenuItem.ownerId currently has `ref: 'User'` in code, but it is used with Restaurant ids in routes. Conceptually, `ownerId` should reference `Restaurant`. The ERD treats it as `Restaurant`.
- Payment.ownerId is a string (user id as text), not an ObjectId ref to User; queries filter by this string. Consider refactoring to `ObjectId` with `ref: 'User'` for referential integrity.
- Restaurant.schema includes `user: [ObjectId(User)]` which isn’t used in most flows; main association is orders and menu.

## Enumerations
- Order.orderStatus: pending | confirmed | ready | shipping | delivered | cancel
- Payment.paymentMethod: Razorpay | VNPay
- Drone.status: AVAILABLE | IN_DELIVERY | MAINTENANCE | OFFLINE

## Embedded Structures
- Order.orderItems: array of documents with shape `{ menuItem?: ObjectId -> MENU_ITEM._id, item: { dishName, price }, quantity }`.
- Drone.currentLocation: `{ latitude, longitude }`.
- Drone.maintenanceSchedule: `{ lastMaintenance, nextMaintenance }`.

## Suggestions
- Change `MenuItem.ownerId` to `ref: 'Restaurant'` and backfill existing data.
- Change `Payment.ownerId` to `ObjectId` with `ref: 'User'` and add an index for performance.
- Consider adding a reverse link from Payment to Order for easier lookups (optional), or keep the unique foreign key on Order as-is.
- If `Restaurant.user` array is unnecessary, remove to avoid confusion.
