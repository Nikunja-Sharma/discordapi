# Subscription Dashboard Design Document

## Overview

The subscription dashboard extends the existing Discord Bot Manager application with a comprehensive subscription management system. It integrates seamlessly with the current React frontend and Node.js backend, adding subscription plans, secure API key management, bot configuration selection, and real-time cost tracking capabilities.

## Architecture

### Frontend Architecture
- **React Components**: New dashboard components integrated with existing AuthContext
- **State Management**: Extended AuthContext to include subscription state
- **Routing**: New protected routes for subscription management
- **UI Framework**: Consistent with existing styling patterns

### Backend Architecture
- **RESTful API**: New subscription endpoints extending existing Express.js API
- **Database Layer**: MongoDB collections for subscriptions, API keys, and usage tracking
- **Security Layer**: Encryption for API keys, JWT authentication for subscription access
- **External Integrations**: OpenAI API validation, payment processing (Stripe/PayPal)

### Data Flow
1. User authentication → Subscription status check → Dashboard access
2. Plan selection → Payment processing → Subscription activation
3. API key input → Validation → Encrypted storage
4. Bot selection → Configuration update → Usage tracking initialization
5. Token usage → Cost calculation → Dashboard display

## Components and Interfaces

### Frontend Components

#### SubscriptionDashboard Component
```jsx
// Main dashboard container
- Subscription status display
- Plan management section
- API key management section
- Bot selector section
- Usage analytics section
```

#### PlanSelector Component
```jsx
// Subscription plan selection interface
- Three pricing tiers (monthly, yearly, 2-year)
- Cost comparison and savings display
- Payment integration
- Plan upgrade/downgrade functionality
```

#### ApiKeyManager Component
```jsx
// Secure API key management
- Encrypted input field
- Connection status indicator
- Key validation feedback
- Update/remove functionality
```

#### BotConfigSelector Component
```jsx
// Bot configuration selection
- 2-3 pre-configured bot options
- Feature comparison display
- Selection interface
- Configuration preview
```

#### UsageTracker Component
```jsx
// Token usage and cost display
- Real-time cost per token
- Usage history charts
- Monthly cost projections
- Export functionality
```

### Backend API Endpoints

#### Subscription Management
```javascript
POST /api/subscriptions/create
GET /api/subscriptions/status
PUT /api/subscriptions/update
DELETE /api/subscriptions/cancel
```

#### API Key Management
```javascript
POST /api/apikeys/validate
PUT /api/apikeys/update
GET /api/apikeys/status
DELETE /api/apikeys/remove
```

#### Bot Configuration
```javascript
GET /api/bots/configurations
PUT /api/bots/select
GET /api/bots/current
```

#### Usage Tracking
```javascript
GET /api/usage/current
GET /api/usage/history
POST /api/usage/track
```

## Data Models

### Subscription Model
```javascript
{
  userId: ObjectId,
  planType: String, // 'monthly', 'yearly', '2-year'
  status: String, // 'active', 'cancelled', 'expired'
  startDate: Date,
  endDate: Date,
  paymentMethod: Object,
  billingHistory: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### ApiKey Model
```javascript
{
  userId: ObjectId,
  encryptedKey: String,
  keyHash: String, // For validation without decryption
  status: String, // 'valid', 'invalid', 'not_set'
  lastValidated: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### BotConfiguration Model
```javascript
{
  userId: ObjectId,
  selectedBotId: String,
  botConfigs: [{
    id: String,
    name: String,
    description: String,
    features: Array,
    estimatedTokensPerMonth: Number
  }],
  updatedAt: Date
}
```

### UsageTracking Model
```javascript
{
  userId: ObjectId,
  date: Date,
  botConfigId: String,
  inputTokens: Number,
  outputTokens: Number,
  totalCost: Number,
  apiCalls: Number,
  createdAt: Date
}
```

## Error Handling

### Frontend Error Handling
- **Network Errors**: Retry mechanism with exponential backoff
- **Validation Errors**: Real-time form validation with user-friendly messages
- **Authentication Errors**: Automatic redirect to login with session restoration
- **Payment Errors**: Clear error messages with retry options

### Backend Error Handling
- **API Key Validation**: Graceful handling of invalid keys with specific error codes
- **Payment Processing**: Comprehensive error handling for failed transactions
- **Database Errors**: Transaction rollback and data consistency checks
- **Rate Limiting**: OpenAI API rate limit handling with queue management

### Error Response Format
```javascript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'User-friendly error message',
    details: 'Technical details for debugging'
  }
}
```

## Testing Strategy

### Unit Testing
- Component rendering and state management
- API endpoint functionality
- Data model validation
- Encryption/decryption utilities
- Cost calculation algorithms

### Integration Testing
- Authentication flow with subscription access
- Payment processing integration
- OpenAI API key validation
- Database operations and transactions
- Frontend-backend API communication

### End-to-End Testing
- Complete subscription workflow
- API key management flow
- Bot configuration selection
- Usage tracking and cost calculation
- Dashboard navigation and functionality

### Security Testing
- API key encryption/decryption
- Authentication and authorization
- Payment data handling
- SQL injection and XSS prevention
- Rate limiting and abuse prevention

## Security Considerations

### API Key Security
- AES-256 encryption for stored API keys
- Key rotation capabilities
- Secure key transmission (HTTPS only)
- No logging of decrypted keys

### Payment Security
- PCI DSS compliance for payment processing
- Tokenized payment methods
- Secure webhook handling
- Fraud detection integration

### Access Control
- JWT-based authentication
- Role-based access control
- Subscription status validation
- API rate limiting per user

### Data Protection
- GDPR compliance for user data
- Data encryption at rest
- Secure data deletion
- Privacy policy compliance