from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from destinations.models import Destination, Park
from region_safaris.models import RegionSafari, RegionSafariItineraryDay

REGION_SAFARIS = [
    {
        "slug": "uluguru-highlands-escape",
        "region_slug": "morogoro",
        "title": "Uluguru Highlands Escape",
        "image": "/images/destinations/morogoro-1.jpeg",
        "image_alt": "Terraced farmland climbing the green slopes of the Uluguru Mountains above Morogoro.",
        "rating": "4.6",
        "days": 3,
        "accommodation": "Highland Guesthouse",
        "price": 480,
        "badge": "Weekend Getaway",
        "signature": False,
        "park_slugs": [],
        "overview": (
            "A cool-climate escape into the Uluguru Mountains — terraced farms, waterfall hikes, and a night "
            "with a local highland family, all within a short drive of Morogoro town."
        ),
        "highlights": [
            "Guided Uluguru Mountain trek to waterfall viewpoints",
            "Overnight village homestay with a local family",
            "Birdwatching walk for the range's endemic species",
        ],
        "included": ["Local guide", "Homestay accommodation (1 night)", "Guesthouse accommodation (1 night)", "All meals"],
        "excluded": ["Transport to Morogoro", "Travel insurance", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival & Village Homestay", "description": "Arrive in Morogoro, transfer into the foothills, and settle in with a host family for the night."},
            {"day": 2, "title": "Uluguru Mountain Trek", "description": "Full-day guided hike through terraced farmland to a waterfall viewpoint, with a picnic lunch on the trail."},
            {"day": 3, "title": "Birdwatching & Departure", "description": "Early birdwatching walk with a specialist local guide before transferring back to town."},
        ],
    },
    {
        "slug": "dar-city-and-coast",
        "region_slug": "dar-es-salaam",
        "title": "Dar es Salaam City & Coast",
        "image": "/images/destinations/dar-es-salaam-1.jpg",
        "image_alt": "The busy harborside fish market at Kivukoni in Dar es Salaam at sunrise.",
        "rating": "4.4",
        "days": 2,
        "accommodation": "City Hotel",
        "price": 320,
        "badge": "",
        "signature": False,
        "park_slugs": [],
        "overview": (
            "A short stopover that trades the safari circuit for Tanzania's largest city — a working harbor "
            "market, a sunset beach, and an open-air museum of the country's traditional homesteads."
        ),
        "highlights": [
            "Sunrise visit to the Kivukoni fish market",
            "Sunset at Coco Beach",
            "Guided walk through the Village Museum",
        ],
        "included": ["Private driver-guide", "Hotel accommodation (1 night)", "Breakfast"],
        "excluded": ["International flights", "Lunch & dinner", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Kivukoni Market & Village Museum", "description": "Early start at the harborside fish market, followed by a guided walk through the Village Museum's traditional homesteads."},
            {"day": 2, "title": "Coco Beach & Departure", "description": "Relaxed morning at Coco Beach before transfer to the airport or onward connection."},
        ],
    },
    {
        "slug": "zanzibar-stone-town-and-spice-trail",
        "region_slug": "zanzibar",
        "title": "Zanzibar Stone Town & Spice Trail",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Pongwe_Beach_Zanzibar.jpg/1280px-Pongwe_Beach_Zanzibar.jpg",
        "image_alt": "The winding alleys of Stone Town, Zanzibar, lined with historic Swahili-Arab architecture.",
        "rating": "4.8",
        "days": 3,
        "accommodation": "Boutique Hotel",
        "price": 650,
        "badge": "Popular",
        "signature": True,
        "park_slugs": ["zanzibar-beaches"],
        "overview": (
            "Zanzibar without the full beach-resort stay — a UNESCO-listed old town, a working spice plantation, "
            "and a traditional dhow cruise at golden hour."
        ),
        "highlights": [
            "Guided Stone Town walking tour",
            "Spice farm tour and tasting",
            "Sunset dhow cruise along the coast",
        ],
        "included": ["Local guide", "Boutique hotel accommodation (2 nights)", "Breakfast daily", "Dhow cruise"],
        "excluded": ["International flights", "Lunch & dinner", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival & Stone Town", "description": "Arrive and settle in, then a guided walking tour through Stone Town's UNESCO-listed alleys."},
            {"day": 2, "title": "Spice Farm Tour", "description": "Full day at a working spice plantation, sampling cloves, nutmeg, and vanilla."},
            {"day": 3, "title": "Sunset Dhow Cruise & Departure", "description": "Free morning at leisure, then a traditional dhow cruise at sunset before departure."},
        ],
    },
    {
        "slug": "arusha-gateway-experience",
        "region_slug": "arusha",
        "title": "Arusha Gateway Experience",
        "image": "/images/destinations/arusha-1.jpg",
        "image_alt": "Rows of coffee plants on a working estate on the slopes near Arusha.",
        "rating": "4.5",
        "days": 3,
        "accommodation": "Lodge",
        "price": 540,
        "badge": "",
        "signature": False,
        "park_slugs": [],
        "overview": (
            "Make the most of your stopover in Tanzania's safari capital — a working coffee estate, the central "
            "market, and a day hike on Mount Meru, before or after your Serengeti circuit."
        ),
        "highlights": [
            "Coffee plantation tour, bean to cup",
            "Cultural market visit for local crafts",
            "Mount Meru day hike",
        ],
        "included": ["Local guide", "Lodge accommodation (2 nights)", "All meals"],
        "excluded": ["International flights", "Park fees (Mount Meru)", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival & Cultural Market", "description": "Arrive in Arusha and spend the afternoon browsing the central market's crafts and produce."},
            {"day": 2, "title": "Mount Meru Day Hike", "description": "A full day on the lower slopes of Mount Meru — big views with none of the Kilimanjaro crowds."},
            {"day": 3, "title": "Coffee Plantation & Departure", "description": "Morning tour of a working coffee estate before transfer to the airport or your safari departure."},
        ],
    },
    {
        "slug": "kilwa-ruins-and-swahili-coast",
        "region_slug": "kilwa",
        "title": "Kilwa Ruins & Swahili Coast",
        "image": "/images/destinations/kilwa-1.jpeg",
        "image_alt": "The weathered coral-stone ruins of the medieval trading city on Kilwa Kisiwani.",
        "rating": "4.7",
        "days": 3,
        "accommodation": "Beach Lodge",
        "price": 590,
        "badge": "",
        "signature": False,
        "park_slugs": [],
        "overview": (
            "Off the beaten path on Tanzania's southern coast — the UNESCO-listed ruins of a medieval trading "
            "empire, a boat trip to a second ruined settlement, and a traditional fishing village."
        ),
        "highlights": [
            "Guided tour of the Kilwa Kisiwani ruins",
            "Boat trip to Songo Mnara island",
            "Traditional fishing village visit",
        ],
        "included": ["Local guide", "Beach lodge accommodation (2 nights)", "All meals", "Boat transfers"],
        "excluded": ["International flights", "Travel insurance", "Gratuities"],
        "itinerary": [
            {"day": 1, "title": "Arrival & Kilwa Kisiwani Ruins", "description": "Arrive and take a guided tour of the UNESCO-listed medieval trading city ruins."},
            {"day": 2, "title": "Songo Mnara Island", "description": "Boat trip to the lesser-visited ruined settlement of Songo Mnara."},
            {"day": 3, "title": "Fishing Village & Departure", "description": "Morning visit to a local fishing village to see traditional dhow-building, then departure."},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed (or update) a signature RegionSafari for each destination/region."

    @transaction.atomic
    def handle(self, *args, **options):
        for entry in REGION_SAFARIS:
            itinerary = entry.pop("itinerary")
            slug = entry.pop("slug")
            region_slug = entry.pop("region_slug")
            park_slugs = entry.pop("park_slugs", [])
            try:
                region = Destination.objects.get(slug=region_slug)
            except Destination.DoesNotExist:
                raise CommandError(f"Destination '{region_slug}' does not exist — seed destinations first.")

            defaults = {**entry, "region": region}
            region_safari, created = RegionSafari.objects.update_or_create(slug=slug, defaults=defaults)
            region_safari.parks.set(Park.objects.filter(slug__in=park_slugs))
            region_safari.itinerary.all().delete()
            for day in itinerary:
                RegionSafariItineraryDay.objects.create(safari=region_safari, **day)

            entry["itinerary"] = itinerary
            entry["region_slug"] = region_slug
            entry["park_slugs"] = park_slugs
            entry["slug"] = slug
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} {slug}"))
