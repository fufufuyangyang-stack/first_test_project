import shutil
import tempfile
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

MEDIA = tempfile.mkdtemp()


def make_jpeg_with_gps(name="photo.jpg"):
    img = Image.new("RGB", (800, 600), "red")
    exif = Image.Exif()
    exif[0x8825] = {2: (1.0, 2.0, 3.0)}  # GPSInfo
    buf = BytesIO()
    img.save(buf, format="JPEG", exif=exif)
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/jpeg")


@override_settings(MEDIA_ROOT=MEDIA)
class PictureFlowTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def register_and_login(self, username):
        self.client.credentials()
        r = self.client.post("/api/auth/register/", {"username": username, "password": "S3cure-pass!"})
        self.assertEqual(r.status_code, 201, r.data)
        r = self.client.post("/api/auth/login/", {"username": username, "password": "S3cure-pass!"})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")

    def upload(self, **extra):
        data = {"image": make_jpeg_with_gps(), "title": "Sunset", **extra}
        return self.client.post("/api/pictures/", data, format="multipart")

    def test_upload_strips_exif_and_makes_thumbnail(self):
        self.register_and_login("alice")
        r = self.upload()
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual((r.data["width"], r.data["height"]), (800, 600))
        self.assertTrue(r.data["thumbnail"])
        from pictures.models import Picture
        pic = Picture.objects.get()
        with pic.image.open("rb") as f:
            self.assertEqual(len(Image.open(f).getexif()), 0)
        self.assertNotIn("photo", pic.image.name)

    def test_rejects_non_image(self):
        self.register_and_login("alice")
        fake = SimpleUploadedFile("x.jpg", b"not an image", content_type="image/jpeg")
        r = self.client.post("/api/pictures/", {"image": fake}, format="multipart")
        self.assertEqual(r.status_code, 400)

    def test_upload_requires_login(self):
        r = self.upload()
        self.assertEqual(r.status_code, 401)

    def test_private_pictures_hidden_from_others(self):
        self.register_and_login("alice")
        pub = self.upload().data["id"]
        priv = self.upload(is_public="false").data["id"]
        self.assertEqual(len(self.client.get("/api/users/alice/pictures/").data["results"]), 2)

        self.register_and_login("bob")
        ids = [p["id"] for p in self.client.get("/api/users/alice/pictures/").data["results"]]
        self.assertEqual(ids, [pub])
        self.assertEqual(self.client.get(f"/api/pictures/{priv}/").status_code, 404)
        self.assertEqual(self.client.get(f"/api/pictures/{priv}/download/").status_code, 404)

    def test_only_owner_can_edit_or_delete(self):
        self.register_and_login("alice")
        pid = self.upload().data["id"]
        self.register_and_login("bob")
        self.assertEqual(self.client.patch(f"/api/pictures/{pid}/", {"title": "x"}).status_code, 403)
        self.assertEqual(self.client.delete(f"/api/pictures/{pid}/").status_code, 403)
        self.register_and_login("carol")
        self.client.credentials()
        r = self.client.post("/api/auth/login/", {"username": "alice", "password": "S3cure-pass!"})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        self.assertEqual(self.client.patch(f"/api/pictures/{pid}/", {"title": "New"}, format="json").data["title"], "New")
        self.assertEqual(self.client.delete(f"/api/pictures/{pid}/").status_code, 204)

    def test_download_sets_attachment(self):
        self.register_and_login("alice")
        pid = self.upload().data["id"]
        r = self.client.get(f"/api/pictures/{pid}/download/")
        self.assertEqual(r.status_code, 200)
        self.assertIn(f'attachment; filename="sunset-{pid}.jpg"', r["Content-Disposition"])

    def test_user_search_and_profile(self):
        self.register_and_login("alice")
        self.upload()
        self.upload(is_public="false")
        self.register_and_login("alfred")
        self.register_and_login("bob")
        names = [u["username"] for u in self.client.get("/api/users/?search=al").data["results"]]
        self.assertEqual(names, ["alfred", "alice"])
        profile = self.client.get("/api/users/alice/").data
        self.assertEqual(profile["picture_count"], 1)
        self.assertNotIn("email", profile)
        self.assertEqual(self.client.get("/api/users/nobody/").status_code, 404)

    def test_me_endpoint(self):
        self.register_and_login("alice")
        r = self.client.patch("/api/me/", {"bio": "Hello"}, format="json")
        self.assertEqual(r.data["bio"], "Hello")
        self.assertEqual(self.client.get("/api/me/").data["username"], "alice")
