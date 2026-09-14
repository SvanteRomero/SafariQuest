from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminRole
from audit.utils import log_action
from config.pagination import StandardPagination

from .models import SupportTicket, SupportTicketNote
from .serializers import (
    SupportTicketCreateSerializer,
    SupportTicketNoteInputSerializer,
    SupportTicketOwnSerializer,
    SupportTicketSerializer,
    SupportTicketUpdateSerializer,
)


class SupportTicketViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    # Only the admin list() action gets a pager. `mine` builds its own Response
    # directly rather than going through list(), so it is unaffected — a
    # reporter's own tickets are a small, inherently bounded set.
    pagination_class = StandardPagination
    queryset = SupportTicket.objects.select_related("reporter", "booking").prefetch_related("notes")

    def get_permissions(self):
        if self.action in ("create", "mine"):
            return [IsAuthenticated()]
        return [IsAdminRole()]

    def get_serializer_class(self):
        if self.action == "create":
            return SupportTicketCreateSerializer
        return SupportTicketSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save(reporter=request.user)
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        instance = self.get_object()
        previous_status = instance.status
        serializer = SupportTicketUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if instance.status != previous_status:
            log_action(
                request.user,
                "ticket.status_changed",
                f"Ticket #{instance.id} moved from {previous_status} to {instance.status}",
            )
        return Response(SupportTicketSerializer(instance).data)

    @action(detail=True, methods=["post"], url_path="notes")
    def notes(self, request, pk=None):
        ticket = self.get_object()
        serializer = SupportTicketNoteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        SupportTicketNote.objects.create(ticket=ticket, author=request.user, text=serializer.validated_data["text"])
        ticket.refresh_from_db()
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        """The requester's own tickets, for the customer/guide Complaints page.

        list/retrieve stay Admin-only: the inbox view carries the internal note
        thread, so it is not something to hand out by relaxing a permission.
        This is a separate, narrower projection — same idea as /api/guides/me/.

        Before this existed, AccountComplaints.tsx had no endpoint it could call
        and rendered a hardcoded "No complaints filed", so a customer who filed
        one was told, permanently, that they had not.
        """
        tickets = self.get_queryset().filter(reporter=request.user)
        return Response(SupportTicketOwnSerializer(tickets, many=True).data)
