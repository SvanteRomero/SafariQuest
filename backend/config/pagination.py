from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Shared pagination for the operational lists that genuinely grow without
    bound: bookings, invoices, customers, support tickets, the audit log.

    Deliberately NOT applied project-wide. The admin-curated catalog data
    (destinations, parks, safaris, region safaris, seasons, the guide roster,
    the admin user list) stays a bare array — those lists are small by nature
    (content someone typed in, or a staff roster) and several of them are read
    by public, unauthenticated pages (the trip planner, site browsing) that
    have no use for a pager and no reason to learn a new response shape.
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
