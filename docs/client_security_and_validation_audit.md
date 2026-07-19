# Client Security & Validation Audit (Phase 6)

This document provides a comprehensive security and input validation audit of the React client codebase.

---

## 🔐 1. JWT Storage & Token Safety Analysis

### Current Implementation
- Both the **Access Token** and the **User metadata** are stored directly in `localStorage`:
  ```typescript
  localStorage.setItem('user', JSON.stringify(userObj));
  localStorage.setItem('token', data.token);
  ```
- Any subsequent HTTP request automatically grabs the token from `localStorage` inside Axios request interceptors (e.g., [bookingService.ts](file:///d:/Motov/Motov/client/src/services/bookingService.ts#L8)).

### Security Evaluation (XSS Vulnerability)
> [!WARNING]
> Storing active JWTs in `localStorage` makes the application vulnerable to **Cross-Site Scripting (XSS)**. If an attacker manages to inject arbitrary JavaScript code into the client app (e.g., via unescaped rendering of user-generated content like comments or chat messages), they can steal the user's active session token using `localStorage.getItem('token')`.

### Recommendation
1. **Access Token**: Store the short-lived `accessToken` (`2h`) in local React state or context memory (in-memory) rather than in `localStorage`.
2. **Refresh Token**: Store the long-lived `refreshToken` in a secure cookie with the following attributes:
   - `httpOnly`: Prevents client-side scripts from reading the cookie.
   - `secure`: Ensures the cookie is only transmitted over HTTPS.
   - `sameSite: 'strict'` or `'lax'`: Mitigates Cross-Site Request Forgery (CSRF) risks.

---

## 🛡️ 2. Input Validation Alignment (Client vs Server Zod)

Below is an analysis of how client-side validations in [Auth.tsx](file:///d:/Motov/Motov/client/src/pages/Auth.tsx) match the server's Zod schemas in [schemas.ts](file:///d:/Motov/Motov/server/src/validators/schemas.ts).

### A. Register Validation Match
- **Server Zod Schema (`registerSchema`)**:
  ```typescript
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  email: z.string().email('Email không đúng định dạng').optional(),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  firstName: z.string().min(1, 'Họ không được để trống'),
  lastName: z.string().min(1, 'Tên không được để trống'),
  ```
- **Client Validation (`Auth.tsx`)**:
  - Username: Requires length `>= 3`. (Match!)
  - Password: Requires length `>= 6`. (Match!)
  - Name split: Splits input into `firstName` and `lastName` (ensures they are not empty). (Match!)
  - Email: Matches basic email format regex. (Match!)

---

## 🔄 3. API Error & Loading States Audit

### Audit Findings
1. **Loading State Indicators**:
   - The [Auth.tsx](file:///d:/Motov/Motov/client/src/pages/Auth.tsx) component correctly implements `loading` state toggling:
     ```typescript
     setLoading(true);
     // ... fetch call ...
     setLoading(false);
     ```
     During loading, form inputs and buttons are appropriately disabled to prevent double-submissions.
2. **Error Message Capture**:
   - Catch blocks successfully parse API error payloads and render readable alerts using local state:
     ```typescript
     } catch (error: any) {
       setError(error.message || 'Đã xảy ra lỗi...');
     } finally {
       setLoading(false);
     }
     ```
3. **HTTP Status Handling**:
   - The UI parses backend JSON error payloads (`data.message`) instead of displaying generic errors, matching the backend's new global error middleware format.
