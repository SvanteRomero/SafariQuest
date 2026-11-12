from django.urls import path

from .views import CardPaymentReturnView, PaymentAvailabilityView, SenjaropayWebhookView, SnippeWebhookView

urlpatterns = [
    path("availability/", PaymentAvailabilityView.as_view(), name="payment-availability"),
    path("snippe/webhook/", SnippeWebhookView.as_view(), name="snippe-webhook"),
    path("senjaropay/webhook/", SenjaropayWebhookView.as_view(), name="senjaropay-webhook"),
    path("senjaropay/return/", CardPaymentReturnView.as_view(), name="senjaropay-return"),
]
