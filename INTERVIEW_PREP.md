# URBANTIQ PROJECT - INTERVIEW PREPARATION GUIDE

---

## 📊 PROJECT ASSESSMENT

### What You Have ✅
- **Full-stack e-commerce platform** (complex real-world project)
- **Multiple user roles** (Admin, User, Supplier)
- **Payment integration** (Razorpay)
- **Complex workflows** (Cart → Order → Payment → Delivery)
- **Database relationships** (Products, Variants, Orders, Coupons)
- **Authentication system** (JWT, Email OTP, Google OAuth)
- **Admin features** (Batch management, Inventory, Analytics)

### Red Flags Interviewers Will Notice ⚠️
| Issue | Impact | Fix Priority |
|-------|--------|--------------|
| No DB transactions | Data consistency risk | CRITICAL |
| Weak input validation | Security vulnerability | CRITICAL |
| Generic error handling | Poor debugging experience | HIGH |
| Cookie secure=false | XSS/CSRF vulnerable | HIGH |
| No logging/monitoring | Hard to debug production issues | HIGH |
| Missing JSDoc comments | Code looks incomplete | MEDIUM |
| No tests | Reliability unclear | MEDIUM |
| Hardcoded env defaults | Security issue | MEDIUM |

---

## 🎯 PHASE 1: CRITICAL FIXES (DO FIRST - 2 hours)

### 1.1 Fix Security Issues
```javascript
// ❌ CURRENT (config/razorpay.js line 6)
key_id: (process.env.RAZORPAY_KEY_ID || "").trim(),

// ✅ FIXED
key_id: process.env.RAZORPAY_KEY_ID?.trim(),
// If missing, throw error instead of silently using empty string
```

```javascript
// ❌ CURRENT (controllers/auth/login.js line 37)
secure: false,

// ✅ FIXED
secure: process.env.NODE_ENV === 'production',
```

### 1.2 Add Input Validation Utility
```javascript
// Create: utils/validation.js
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') throw new Error('Invalid email');
  return email.toLowerCase().trim();
};

export const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ID format');
  }
  return new mongoose.Types.ObjectId(id);
};

export const validateQuantity = (qty) => {
  const num = Number(qty);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('Quantity must be positive integer');
  }
  return num;
};
```

### 1.3 Create Error Handler Utility
```javascript
// Create: utils/errorHandler.js
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export const errorResponse = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }
  console.error('Unexpected error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};
```

### 1.4 Add JSDoc to Key Functions
```javascript
/**
 * Authenticates user via email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object with JWT token
 * @throws {AppError} If user not found or password invalid
 */
export const login = async (req, res) => { ... };
```

---

## 🎯 PHASE 2: MAJOR CODE IMPROVEMENTS (3-4 hours)

### 2.1 Add Transaction Support to placeOrder
**File:** `controllers/order/placeOrder.js`

```javascript
export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, shippingAddress, paymentMethod, couponCode, finalAmount } = req.body;

    // Validation Phase
    if (!items?.length) throw new AppError('No items in order', 400);
    if (!shippingAddress) throw new AppError('Shipping address required', 400);

    // Stock validation (read-only, no mutations)
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new AppError('Product not found', 404);

      const variant = product.variants.id(item.variant);
      const size = variant.sizes.find(s => s.size === item.size);
      
      if (!size || size.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}`, 400);
      }
    }

    // Create order within transaction
    const order = new Order({
      user: req.userId,
      items,
      shippingAddress,
      totalPrice: finalAmount,
      orderStatus: 'Pending'
    });
    await order.save({ session });

    // Update inventory within transaction
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { 'variants.$[v].sizes.$[s].stock': -item.quantity } },
        {
          arrayFilters: [
            { 'v._id': item.variant },
            { 's.size': item.size }
          ],
          session
        }
      );

      // Update batch remaining quantity
      await PurchaseItem.updateOne(
        {
          'allocations.variantId': item.variant,
          'allocations.size': item.size
        },
        { $inc: { 'allocations.$[a].remainingQuantity': -item.quantity } },
        { arrayFilters: [{ 'a.variantId': item.variant, 'a.size': item.size }], session }
      );
    }

    // Update cart
    await Cart.deleteMany({ user: req.userId }, { session });

    await session.commitTransaction();
    res.json({ success: true, order });

  } catch (error) {
    await session.abortTransaction();
    errorResponse(res, error);
  } finally {
    session.endSession();
  }
};
```

### 2.2 Improve Batch Linking with Transactions
**File:** `controllers/batch/linkBatch.js`

```javascript
export const linkBatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { allocations } = req.body;

    if (!allocations?.length) {
      throw new AppError('At least one allocation required', 400);
    }

    const batch = await PurchaseItem.findById(id).session(session);
    if (!batch) throw new AppError('Batch not found', 404);
    if (batch.status === 'LINKED') throw new AppError('Batch already linked', 400);

    // Validate allocations
    let totalQty = 0;
    for (const alloc of allocations) {
      const qty = validateQuantity(alloc.quantity);
      const variantId = validateObjectId(alloc.variantId);
      totalQty += qty;

      // Verify variant exists
      const product = await Product.findOne(
        { 'variants._id': variantId },
        { 'variants.$': 1 }
      ).session(session);

      if (!product) {
        throw new AppError(`Variant ${variantId} not found`, 404);
      }

      const sizeExists = product.variants[0].sizes.some(s => s.size === alloc.size);
      if (!sizeExists) {
        throw new AppError(`Size ${alloc.size} not found`, 404);
      }
    }

    if (totalQty !== batch.quantity) {
      throw new AppError(
        `Total quantity (${totalQty}) doesn't match batch (${batch.quantity})`,
        400
      );
    }

    // Update batch allocations
    batch.allocations = allocations.map(a => ({
      variantId: validateObjectId(a.variantId),
      size: a.size,
      quantity: validateQuantity(a.quantity),
      remainingQuantity: validateQuantity(a.quantity)
    }));

    // Bulk update stock
    const bulkOps = batch.allocations.map(alloc => ({
      updateOne: {
        filter: { 'variants._id': alloc.variantId },
        update: { $inc: { 'variants.$[v].sizes.$[s].stock': alloc.quantity } },
        arrayFilters: [
          { 'v._id': alloc.variantId },
          { 's.size': alloc.size }
        ]
      }
    }));

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps, { session });
    }

    batch.status = 'LINKED';
    await batch.save({ session });

    await session.commitTransaction();
    res.json({ 
      success: true, 
      message: 'Batch linked successfully',
      batch 
    });

  } catch (error) {
    await session.abortTransaction();
    errorResponse(res, error);
  } finally {
    session.endSession();
  }
};
```

### 2.3 Improve Authentication Middleware
**File:** `middleware/authMiddleware.js`

```javascript
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler.js';

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const message = 'Session expired';
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ success: false, message });
      }
      return res.redirect('/login?expired=true');
    }

    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.redirect('/login');
  }
};

export default authMiddleware;
```

---

## 🎯 PHASE 3: INTERVIEW TALKING POINTS (1 hour prep)

### Architecture & Design Decisions

**Question:** "Walk us through your system architecture"
```
Answer: "The system uses MVC architecture with:
- Express.js for routing and middleware
- MongoDB with Mongoose ODM for data persistence
- JWT-based authentication with httpOnly cookies
- Separate middleware for user vs admin authorization
- Batch-based inventory management for FIFO stock allocation
- Razorpay integration for payments
- Transaction support for critical operations like orders"
```

**Question:** "Why did you choose MongoDB over SQL?"
```
Answer: "MongoDB's flexibility fits e-commerce well:
- Products have variable attributes (variants, sizes)
- Nested documents (products → variants → sizes) map naturally
- Easy to scale horizontally
- Document queries are intuitive for complex business logic
- Trade-off: Need to manage consistency (hence transactions)"
```

**Question:** "How do you ensure data consistency?"
```
Answer: "I implemented MongoDB transactions for critical paths:
- placeOrder: Stock update + Order creation atomic
- linkBatch: Inventory allocation + batch status atomic
- This prevents scenarios where order is created but stock not deducted
- Also validate data before mutations (pre-checks)"
```

**Question:** "How would you handle 10,000 concurrent orders?"
```
Answer: "Strategies:
1. Database: Add indexes on userId, productId for fast queries
2. Transactions: Current implementation uses sessions (scales to ~100-200 concurrent)
3. Caching: Redis for frequently accessed data (categories, products)
4. Queue: Use Bull/RabbitMQ for order processing instead of synchronous
5. Sharding: Split data by region/time
6. Load balancing: PM2 cluster mode or Kubernetes
7. Rate limiting: Prevent abuse on sensitive endpoints"
```

**Question:** "Describe your order processing flow"
```
Answer:
1. User adds items to cart
2. User reviews cart and checks out
3. System validates:
   - All items still in stock
   - FIFO batch availability
   - User has shipping address
4. If payment method is online:
   - Create Razorpay order
   - Return payment link to user
5. After payment verified:
   - Create Order (ATOMIC with stock update in transaction)
   - Deduct from batch remaining quantities
   - Clear user's cart
6. Order status flows: Pending → Confirmed → Shipped → Delivered"
```

### Database Design Questions

**Question:** "How is your inventory management structured?"
```
Answer: "Two-level system:
- Product model: stores variants with sizes and stock levels
- PurchaseItem model: tracks batches from suppliers
- Flow: Supplier sends batch → Admin links batch to product variants → Stock updates
- Remaining quantity in batch tracks fulfillment (FIFO consumption)
- Benefit: Full audit trail of inventory sources"
```

**Question:** "What indexes do you need?"
```
Answer: "I would add:
- User: email (unique), isVerified
- Product: category, status
- PurchaseItem: status ('LINKED' vs 'UNLINKED')
- Order: userId, orderStatus
- Cart: userId (unique)
- Batch allocations: variantId + size for fast lookup"
```

### Security Questions

**Question:** "How do you protect against XSS attacks?"
```
Answer:
- httpOnly cookies prevent JavaScript access
- Input validation/sanitization on all endpoints
- Use validator library for email, password, URLs
- EJS auto-escapes template variables
- Would add HELMET middleware for security headers"
```

**Question:** "What about SQL injection?"
```
Answer: "Not applicable with MongoDB/Mongoose:
- Mongoose queries use parameter binding
- But I still validate/sanitize all inputs
- Use schema validation for type safety
- Validate ObjectIds before queries"
```

**Question:** "How do you handle passwords?"
```
Answer:
- Hash with bcrypt (salt rounds: 10)
- Never log passwords
- JWT tokens for sessions (not storing sensitive data)
- Password reset via email OTP
- Cookie secure flag enabled in production"
```

---

## 📋 WHAT TO PREPARE FOR INTERVIEW

### 1. System Walkthrough (10 min)
- [ ] Create ASCII architecture diagram
- [ ] Prepare data flow examples
- [ ] Know your file structure by heart

### 2. Code Examples (15 min)
- [ ] Know your most complex controller (placeOrder)
- [ ] Explain batch linking logic
- [ ] Describe authentication flow
- [ ] Show transaction implementation

### 3. Problem Scenarios (15 min)
Prepare answers for:
- "What if two users buy last item simultaneously?"
  - A: Transactions ensure only one succeeds
- "How to handle failed payment retry?"
  - A: Order stays pending, can retry with new payment
- "What if batch allocation fails mid-transaction?"
  - A: Entire transaction aborts, no partial updates
- "How to scale to 100k users?"
  - A: Caching, clustering, horizontal scaling, sharding

### 4. Know Your Weaknesses
- [ ] What's NOT production-ready yet (no tests, no logging)
- [ ] How would you improve it (transaction support, input validation)
- [ ] Learning outcomes (discovered importance of ACID, transactions)

---

## 🚀 IMMEDIATE ACTION ITEMS

**Before Interview (In order):**

- [ ] **1-2 hours:** Implement Phase 1 fixes (security + validation)
- [ ] **2-3 hours:** Implement transactions in placeOrder + linkBatch
- [ ] **1 hour:** Create architecture documentation
- [ ] **1 hour:** Practice explaining each component
- [ ] **30 min:** List 5-10 improvements you'd make with more time

---

## 📝 QUICK REFERENCE SCRIPT

**Opening Statement (30 seconds):**
"I built Urbantiq, a full-stack e-commerce platform. It's Node.js + Express + MongoDB using MVC architecture. Key features include multi-role authentication, product catalog with variants/sizes, shopping cart, and integrated payments via Razorpay. I handle complex workflows like orders and inventory management using MongoDB transactions for data consistency."

**Common Follow-up Handling:**
- "How'd you build this?" → Explain MVC layer by layer
- "What was hard?" → Talk about transactions/inventory sync
- "Any bugs?" → Show you fixed cookie security, improved validation
- "What would you change?" → Mention logging, tests, caching, rate limiting

---

## 🎓 LESSONS TO HIGHLIGHT

✅ "I learned importance of ACID transactions in e-commerce"
✅ "Discovered MongoDB transactions support complex workflows"
✅ "Realized batch allocation problem before building checkout"
✅ "Implemented proper error handling for user experience"
✅ "Security: httpOnly + SameSite cookies for CSRF protection"

Good luck! 🚀
