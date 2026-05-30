insert into public.restaurants
  (id, name, cuisine, address, latitude, longitude, price_level, photo_url, google_maps_url, is_active)
values
  ('10000000-0000-0000-0000-000000000001', 'Everyday Noodles', 'Chinese noodles', '5875 Forbes Ave, Pittsburgh, PA 15217', 40.4387, -79.9213, 2, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Everyday+Noodles+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000002', 'Bao', 'Chinese buns', '114 Atwood St, Pittsburgh, PA 15213', 40.4392, -79.9569, 2, 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Bao+Atwood+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000003', 'Stack''d Oakland', 'Burgers', '3716 Forbes Ave, Pittsburgh, PA 15213', 40.4416, -79.9564, 2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Stackd+Oakland+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000004', 'The Porch at Schenley', 'American', '221 Schenley Dr, Pittsburgh, PA 15213', 40.4427, -79.9516, 3, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=The+Porch+at+Schenley', true),
  ('10000000-0000-0000-0000-000000000005', 'Oishii Bento', 'Korean Japanese', '119 Oakland Ave, Pittsburgh, PA 15213', 40.4417, -79.9560, 2, 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Oishii+Bento+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000006', 'Sushi Fuku', 'Sushi', '120 Oakland Ave, Pittsburgh, PA 15213', 40.4414, -79.9560, 2, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Sushi+Fuku+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000007', 'Roots Natural Kitchen', 'Bowls', '3610 Forbes Ave, Pittsburgh, PA 15213', 40.4412, -79.9578, 2, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Roots+Natural+Kitchen+Oakland+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000008', 'Piada Italian Street Food', 'Italian', '3600 Forbes Ave, Pittsburgh, PA 15213', 40.4411, -79.9584, 2, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Piada+Italian+Street+Food+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000009', 'Chipotle Mexican Grill', 'Mexican', '3619 Forbes Ave, Pittsburgh, PA 15213', 40.4415, -79.9574, 1, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Chipotle+Forbes+Ave+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000010', 'Noodlehead', 'Thai noodles', '242 S Highland Ave, Pittsburgh, PA 15206', 40.4583, -79.9254, 2, 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Noodlehead+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000011', 'Teppanyaki Kyoto', 'Japanese', '5808 Bryant St, Pittsburgh, PA 15206', 40.4757, -79.9195, 3, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Teppanyaki+Kyoto+Pittsburgh', true),
  ('10000000-0000-0000-0000-000000000012', 'Szechuan Spice', 'Sichuan', '5700 Centre Ave, Pittsburgh, PA 15206', 40.4574, -79.9344, 2, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80', 'https://www.google.com/maps/search/?api=1&query=Szechuan+Spice+Pittsburgh', true)
on conflict (id) do update set
  name = excluded.name,
  cuisine = excluded.cuisine,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  price_level = excluded.price_level,
  photo_url = excluded.photo_url,
  google_maps_url = excluded.google_maps_url,
  is_active = excluded.is_active,
  updated_at = now();
