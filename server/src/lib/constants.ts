export const ErrorMsg = {
  CONTACT: {
    notFound: 'Contact not found',
    createFailed: 'Failed to create contact',
  },
  SUBSCRIPTION: {
    alreadySubscribed: 'This email is already subscribed',
    notFound: 'Subscription not found',
  },
  TESTIMONIAL: {
    notFound: 'Testimonial not found',
  },
  FAQ: {
    notFound: 'FAQ not found',
  },
  BLOG_CATEGORY: {
    notFound: 'Blog category not found',
    hasActiveBlogs: 'Cannot delete blog category with active blogs',
  },
  BLOG: {
    notFound: 'Blog not found',
  },
  KITCHEN: {
    notFound: 'Kitchen not found',
    emailExists: 'Kitchen with this email already exists',
  },
  ROLE: {
    notFound: 'Role not found',
    nameExists: 'Role with this name already exists',
  },
  PERMISSION: {
    notFound: 'Permission not found',
    nameExists: 'Permission with this name already exists',
    usedByRole: 'Cannot delete permission that is used by roles',
  },
  USER: {
    requireAuthToken: 'Authorization token is required',
    notFound: 'User not found',
    incorrectCredentials: 'Incorrect credentials',
    sendOtp: 'OTP sent successfully',
    verifyOtp: 'OTP verified successfully',
    passwordUpdated: 'Password updated successfully',
    samePassword: 'New password cannot be the same as the old password',
  },
  EXCEPTIONS: {
    wentWrong: 'Something went wrong',
    corsNotAllowed: 'Not allowed by CORS',
  },
  CHEF: {
    notFound: 'Chef not found',
  },
};

export const SuccessMsg = {
  LEGAL_CONTENT: {
    update: 'Legal content updated successfully',
    get: 'Legal content fetched successfully',
  },
  USER: {
    forgotPassword: 'Forgot password email sent successfully',
    update: 'Profile updated successfully',
    login: 'Login successful',
    logout: 'Logout successful',
    sendOtp: 'OTP sent successfully',
    verifyOtp: 'OTP verified successfully',
    passwordUpdated: 'Password updated successfully',
    getAll: 'All users fetched successfully',
    get: 'User fetched successfully',
  },
  SUBSCRIPTION: {
    subscribed: 'Successfully subscribed to newsletter',
    unsubscribed: 'Successfully unsubscribed from newsletter',
  },
  CONTACT: {
    created: 'Thank you for contacting us! We will get back to you soon.',
    replied: 'Reply sent successfully to the contact.',
  },
  TESTIMONIAL: {
    created: 'Testimonial created successfully',
    updated: 'Testimonial updated successfully',
    deleted: 'Testimonial deleted successfully',
    get: 'Testimonials fetched successfully',
  },
  FAQ: {
    created: 'FAQ created successfully',
    updated: 'FAQ updated successfully',
    deleted: 'FAQ deleted successfully',
    get: 'FAQs fetched successfully',
  },
  BLOG_CATEGORY: {
    created: 'Blog category created successfully',
    updated: 'Blog category updated successfully',
    deleted: 'Blog category deleted successfully',
    get: 'Blog categories fetched successfully',
  },
  BLOG: {
    created: 'Blog created successfully',
    updated: 'Blog updated successfully',
    deleted: 'Blog deleted successfully',
    get: 'Blogs fetched successfully',
  },
  KITCHEN: {
    created: 'Kitchen created successfully',
    updated: 'Kitchen updated successfully',
    deleted: 'Kitchen deleted successfully',
    get: 'Kitchens fetched successfully',
  },
  ROLE: {
    created: 'Role created successfully',
    updated: 'Role updated successfully',
    deleted: 'Role deleted successfully',
    get: 'Roles fetched successfully',
  },
  PERMISSION: {
    created: 'Permission created successfully',
    updated: 'Permission updated successfully',
    deleted: 'Permission deleted successfully',
    get: 'Permissions fetched successfully',
  },
  CHEF: {
    created: 'Chef created successfully',
    updated: 'Chef updated successfully',
    deleted: 'Chef deleted successfully',
    get: 'Chefs fetched successfully',
  },
  UPDATED: 'Updated successfully',
};

export const ROLE = {
  ADMIN: {
    SUPER_ADMIN: 'super_admin',
    SUB_ADMIN: 'sub_admin',
  }
};

export const OTPType = {
  TYPE: {
    register: 'register',
    login: 'login',
    changeEmail: 'change_email',
    changeMobile: 'change_mobile',
    changePassword: 'change_password',
    forgotPassword: 'forgot_password',
    machineOnboard: 'machine_onboard',
  },
};
export const AccountStatus = {
  STATUS: {
    ACTIVE: 'active',
    PENDING: 'pending',
    DELETED: 'deleted',
    REJECTED: 'rejected',
    REQUESTED: 'requested',
    COMPLETED: 'completed',
  },
};

export const UserType = {
  TYPE: {
    customer: 'customer',
    professional: 'professional',
  },
};



export const DeliveryConstants = {
  WebhookAuthorized: 'Unauthorized webhook request',
  InvalidDeliveryOrder: 'Invalid delivery order ID',
} 

export const ENV = {
  production: 'production',
  development: 'development',
  test: 'test',
};
