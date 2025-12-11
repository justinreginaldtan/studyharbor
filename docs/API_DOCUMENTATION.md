# API Documentation for StudyHarbor

This document outlines the public-facing API endpoints used within the StudyHarbor application.

---

## 1. Checkout API Endpoint

This endpoint is responsible for initiating a Stripe Checkout Session for user subscriptions.

*   **URL:** `/api/checkout`
*   **Method:** `POST`

### Request Body

The request body should be a JSON object containing the `priceId` of the Stripe product and the `userId` of the customer.

| Field    | Type     | Description                                | Required | Example                  |
| :------- | :------- | :----------------------------------------- | :------- | :----------------------- |
| `priceId` | `string` | The ID of the Stripe Price object.         | Yes      | `price_123abcDEF`        |
| `userId`  | `string` | The Supabase Auth `id` of the user.        | Yes      | `a1b2c3d4-e5f6-7890-abcd` |

### Response

On success, returns a JSON object containing the URL to the Stripe Checkout page.

*   **Status:** `200 OK`
*   **Body:**
    ```json
    {
      "url": "https://checkout.stripe.com/pay/cs_test_..."
    }
    ```

### Error Responses

| Status Code | Body Example                                   | Description                                       |
| :---------- | :--------------------------------------------- | :------------------------------------------------ |
| `405`       | `{"message": "Method Not Allowed"}`            | Only `POST` requests are allowed.                 |
| `401`       | `{"message": "User not found or unauthenticated"}` | The provided `userId` does not correspond to a valid user. |
| `400`       | `{"message": "User email not found"}`          | The user linked to `userId` has no associated email. |
| `429`       | `{"message": "Too Many Requests"}`             | Rate limit exceeded for the `userId`.             |
| `500`       | `{"message": "Internal Server Error"}`         | Generic server error during session creation.     |

---

## 2. Stripe Webhook Endpoint

This endpoint receives events from Stripe, typically used to update the application's database based on subscription changes.

*   **URL:** `/api/webhooks/stripe`
*   **Method:** `POST`

### Request Body

The request body is a raw JSON payload from Stripe, containing details about the event. This body is verified using the `stripe-signature` header.

### Headers

| Header           | Description                                        | Required |
| :--------------- | :------------------------------------------------- | :------- |
| `stripe-signature` | Stripe's signature for payload verification.       | Yes      |

### Expected Events Handled

The webhook handler processes the following Stripe event types:

*   **`checkout.session.completed`**: Triggered when a customer successfully completes a Stripe Checkout Session. If the session is for a subscription, the handler retrieves the subscription details and calls `handleSubscriptionCreated`.
*   **`customer.subscription.created`**: Triggered when a new subscription is created (e.g., after `checkout.session.completed` for subscriptions). Calls `handleSubscriptionUpdated` to set the user's `subscription_status`.
*   **`customer.subscription.updated`**: Triggered when a subscription's status changes (e.g., from `trialing` to `active`, or after a payment failure). Calls `handleSubscriptionUpdated`.
*   **`customer.subscription.deleted`**: Triggered when a subscription is canceled or expires. Calls `handleSubscriptionDeleted`.

### Response

On successful processing (or ignoring an irrelevant event type), returns a JSON object confirming receipt.

*   **Status:** `200 OK`
*   **Body:**
    ```json
    {
      "received": true
    }
    ```

### Error Responses

| Status Code | Body Example                                   | Description                                       |
| :---------- | :--------------------------------------------- | :------------------------------------------------ |
| `405`       | `{"message": "Method Not Allowed"}`            | Only `POST` requests are allowed.                 |
| `400`       | `{"message": "Webhook Error: No signature"}`   | Invalid `stripe-signature` header or malformed event. |
| `500`       | `{"message": "Server configuration error"}`    | Missing `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` environment variables. |
| `500`       | `{"message": "Webhook handler failed"}`        | Generic server error during event processing.     |

---
