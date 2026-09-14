import secrets

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Guide, GuideCertification

User = get_user_model()


class GuideCertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideCertification
        fields = ["id", "title", "valid_until", "document"]


class GuideSerializer(serializers.ModelSerializer):
    certifications = GuideCertificationSerializer(many=True, read_only=True)

    class Meta:
        model = Guide
        fields = [
            "id",
            "name",
            "role",
            "status",
            "rating",
            "bio",
            "languages",
            "specialties",
            "certifications",
            "user",
        ]


class GuideCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Guide.ROLE_CHOICES)

    def validate_email(self, value):
        value = User.objects.normalize_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        password = secrets.token_urlsafe(9)
        user = User(email=validated_data["email"], name=validated_data["name"], role=User.ROLE_GUIDE)
        user.set_password(password)
        user.save()
        guide = Guide.objects.create(name=validated_data["name"], role=validated_data["role"], user=user)
        guide.temporary_password = password
        return guide


class GuideCreatedSerializer(GuideSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    temporary_password = serializers.CharField(read_only=True)

    class Meta(GuideSerializer.Meta):
        fields = GuideSerializer.Meta.fields + ["email", "temporary_password"]


class GuideSelfUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guide
        fields = ["name", "status", "bio", "languages", "specialties"]


class GuideCertificationInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideCertification
        fields = ["title", "valid_until", "document"]
