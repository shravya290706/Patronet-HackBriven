import urllib.request

candidates = [
    ("smartphone", "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=700&q=80"),
    ("smartphone", "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=700&q=80"),
    ("monitor", "https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?auto=format&fit=crop&w=700&q=80"),
    ("monitor", "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80"),
    ("blazer", "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80"),
    ("blazer", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=700&q=80"),
    ("almonds", "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80"),
    ("almonds", "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=700&q=80"),
    ("almonds", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=700&q=80"),
    ("kettle", "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&w=700&q=80"),
    ("kettle", "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=700&q=80"),
    ("makeup", "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80"),
    ("makeup", "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=700&q=80"),
    ("makeup", "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=700&q=80")
]

headers = {"User-Agent": "Mozilla/5.0"}

for tag, url in candidates:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"{tag}: {resp.status} -> {url}")
    except Exception as e:
        print(f"{tag}: FAILED ({e}) -> {url}")
