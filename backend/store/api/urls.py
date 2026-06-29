from django.urls import path

from store.views import (
    AdminOrderListAPIView,
    AdminOrderManageAPIView,
    AdminOverviewAPIView,
    AdminProductListCreateAPIView,
    AdminProductManageAPIView,
    CategoryListAPIView,
    CustomerOrderListAPIView,
    HealthCheckView,
    IyzicoCallbackAPIView,
    LoginAPIView,
    LogoutAPIView,
    MeAPIView,
    OrderCreateAPIView,
    ProductDetailAPIView,
    ProductListAPIView,
    RegisterAPIView,
    StoreAPIView,
    StoreStatsAPIView,
)

app_name = "store-api"

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health"),
    path("auth/login/", LoginAPIView.as_view(), name="auth-login"),
    path("auth/register/", RegisterAPIView.as_view(), name="auth-register"),
    path("auth/me/", MeAPIView.as_view(), name="auth-me"),
    path("auth/logout/", LogoutAPIView.as_view(), name="auth-logout"),
    path("store/", StoreAPIView.as_view(), name="store-detail"),
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("admin/overview/", AdminOverviewAPIView.as_view(), name="admin-overview"),
    path("admin/products/", AdminProductListCreateAPIView.as_view(), name="admin-product-list-create"),
    path("admin/products/<int:pk>/", AdminProductManageAPIView.as_view(), name="admin-product-manage"),
    path("admin/orders/", AdminOrderListAPIView.as_view(), name="admin-order-list"),
    path("admin/orders/<int:pk>/", AdminOrderManageAPIView.as_view(), name="admin-order-manage"),
    path("customer/orders/", CustomerOrderListAPIView.as_view(), name="customer-order-list"),
    path("products/", ProductListAPIView.as_view(), name="product-list"),
    path("products/<slug:slug>/", ProductDetailAPIView.as_view(), name="product-detail"),
    path("orders/", OrderCreateAPIView.as_view(), name="order-create"),
    path("payments/iyzico/callback/", IyzicoCallbackAPIView.as_view(), name="iyzico-callback"),
    path("stats/", StoreStatsAPIView.as_view(), name="store-stats"),
]
