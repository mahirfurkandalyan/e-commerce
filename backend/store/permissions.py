from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    message = "Admin access is required."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return True

        profile = getattr(user, "profile", None)
        return bool(profile and profile.role == "admin")


class IsAuthenticatedCustomer(BasePermission):
    message = "Authenticated customer access is required."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_staff or user.is_superuser:
            return False

        profile = getattr(user, "profile", None)
        return bool(profile and profile.role == "customer")
