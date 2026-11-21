import urllib.request
import json

# Define the curated 48 products
curated_products = [
    # -------------------------------------------------------------
    # 1. Electronics (8 products)
    # -------------------------------------------------------------
    {
        "category": "Electronics",
        "name": "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
        "brand": "Sony",
        "sku": "PN-ELE-001",
        "price": 22990.00,
        "description": "Industry-leading wireless noise cancelling over-ear headphones with 30-hour battery life, touch sensor controls, and speak-to-chat technology.",
        "specifications": {"Battery Life": "30 Hours", "Connectivity": "Bluetooth 5.0", "Type": "Over-Ear", "Weight": "254g"},
        "primary_image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Electronics",
        "name": "Apple MacBook Air 13-inch M2 Chip",
        "brand": "Apple",
        "sku": "PN-ELE-002",
        "price": 94990.00,
        "description": "Incredibly thin and fast laptop with Apple M2 chip, 13.6-inch Liquid Retina display, 8GB unified memory, and 256GB SSD storage.",
        "specifications": {"Processor": "Apple M2", "RAM": "8GB Unified", "Storage": "256GB SSD", "Screen": "13.6-inch Liquid Retina"},
        "primary_image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Electronics",
        "name": "OnePlus 12 5G Smartphone (16GB RAM, 512GB)",
        "brand": "OnePlus",
        "sku": "PN-ELE-003",
        "price": 64999.00,
        "description": "Flagship 5G smartphone powered by Snapdragon 8 Gen 3, 2K 120Hz ProXDR display with 4th Gen Hasselblad camera system.",
        "specifications": {"RAM": "16GB", "Storage": "512GB", "Processor": "Snapdragon 8 Gen 3", "Battery": "5400 mAh"},
        "primary_image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Electronics",
        "name": "Apple iPad Air 11-inch M2 Wi-Fi",
        "brand": "Apple",
        "sku": "PN-ELE-004",
        "price": 59900.00,
        "description": "Versatile tablet with stunning Liquid Retina display, powered by Apple M2 chip, supporting Apple Pencil Pro and Magic Keyboard.",
        "specifications": {"Screen": "11-inch Liquid Retina", "Chip": "Apple M2", "Storage": "128GB", "OS": "iPadOS"},
        "primary_image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Electronics",
        "name": "Samsung Galaxy Watch 6 Bluetooth 44mm",
        "brand": "Samsung",
        "sku": "PN-ELE-005",
        "price": 24999.00,
        "description": "Advanced smartwatch featuring personalized heart rate zones, sleep tracking, sapphire crystal glass, and Wear OS powered by Samsung.",
        "specifications": {"Display": "1.5-inch Super AMOLED", "Connectivity": "Bluetooth, Wi-Fi, NFC", "Water Resistance": "5ATM + IP68"},
        "primary_image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Electronics",
        "name": "boAt Airdopes 141 ANC True Wireless Earbuds",
        "brand": "boAt",
        "sku": "PN-ELE-006",
        "price": 1799.00,
        "description": "TWS earbuds featuring up to 32dB active noise cancellation, 42 hours total playback, and ENx technology quad mics for clear calls.",
        "specifications": {"Playback Time": "42 Hours", "Noise Cancellation": "Active up to 32dB", "Driver": "10mm Drivers"},
        "primary_image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Electronics",
        "name": "Dell 27-inch 4K UHD IPS Monitor (S2721QS)",
        "brand": "Dell",
        "sku": "PN-ELE-007",
        "price": 28499.00,
        "description": "27-inch 4K UHD monitor with ultrathin bezel design, AMD FreeSync technology, HDR playback support, and height-adjustable stand.",
        "specifications": {"Resolution": "3840 x 2160 (4K)", "Refresh Rate": "60Hz", "Panel Type": "IPS", "Ports": "2x HDMI, DisplayPort"},
        "primary_image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Electronics",
        "name": "Mi 20000mAh 18W Fast Charging Power Bank 3i",
        "brand": "Xiaomi",
        "sku": "PN-ELE-008",
        "price": 1999.00,
        "description": "High-capacity portable power bank with dual USB output, two-way 18W fast charging, and advanced 12-layer circuit protection.",
        "specifications": {"Capacity": "20000 mAh", "Output": "18W Fast Charge", "Ports": "Triple Output, Dual Input", "Weight": "434g"},
        "primary_image": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80"
        ]
    },

    # -------------------------------------------------------------
    # 2. Fashion (8 products)
    # -------------------------------------------------------------
    {
        "category": "Fashion",
        "name": "Levi's Men's 511 Slim Fit Stretch Jeans",
        "brand": "Levi's",
        "sku": "PN-FAS-001",
        "price": 2799.00,
        "description": "Classic 511 slim fit jeans crafted from premium stretch denim for all-day comfort and timeless casual styling.",
        "specifications": {"Fit": "Slim Fit", "Material": "99% Cotton, 1% Elastane", "Closure": "Zip Fly with Button", "Care": "Machine Wash"},
        "primary_image": "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Fashion",
        "name": "Allen Solly Men's Regular Fit Cotton Polo T-Shirt",
        "brand": "Allen Solly",
        "sku": "PN-FAS-002",
        "price": 1099.00,
        "description": "Signature pique cotton polo shirt featuring ribbed collar and cuffs with the iconic Allen Solly stag embroidery.",
        "specifications": {"Material": "100% Combed Cotton", "Pattern": "Solid Pique", "Sleeve": "Short Sleeve", "Neck": "Collared Polo"},
        "primary_image": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Fashion",
        "name": "Fabindia Women's Handcrafted Cotton Straight Kurta",
        "brand": "Fabindia",
        "sku": "PN-FAS-003",
        "price": 1890.00,
        "description": "Elegant handloom pure cotton kurta with round neck, three-quarter sleeves, side slits, and artisanal block print detailing.",
        "specifications": {"Fabric": "100% Handloom Cotton", "Fit": "Regular Straight", "Length": "Calf Length", "Occasion": "Daily & Festive"},
        "primary_image": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Fashion",
        "name": "Biba Women's Printed Anarkali Kurta & Dupatta Set",
        "brand": "Biba",
        "sku": "PN-FAS-004",
        "price": 3499.00,
        "description": "Graceful printed cotton Anarkali suit set with coordinating printed chiffon dupatta, gold border accents, and tailored silhouette.",
        "specifications": {"Set Includes": "Kurta with Dupatta", "Material": "Cotton with Chiffon", "Pattern": "Floral Foil Print"},
        "primary_image": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Fashion",
        "name": "Nike Air Max SC Men's Running Shoes",
        "brand": "Nike",
        "sku": "PN-FAS-005",
        "price": 5995.00,
        "description": "Heritage running design meets modern comfort with visible Max Air cushioning, lightweight mesh uppers, and durable rubber outsoles.",
        "specifications": {"Sole": "Rubber with Max Air Unit", "Upper": "Leather, Textile & Mesh", "Closure": "Lace-Up", "Type": "Sneakers"},
        "primary_image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80",
            "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Fashion",
        "name": "Puma Classic Unisex Suede Low-Top Sneakers",
        "brand": "Puma",
        "sku": "PN-FAS-006",
        "price": 4499.00,
        "description": "The quintessential street-style sneaker made with premium full-suede uppers, metallic foil branding, and non-marking rubber sole.",
        "specifications": {"Material": "100% Suede Leather", "Fastening": "Laces", "Insole": "Comfort Cushioned", "Style": "Street Casual"},
        "primary_image": "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Fashion",
        "name": "Peter England Men's Slim Fit Formal Cotton Shirt",
        "brand": "Peter England",
        "sku": "PN-FAS-007",
        "price": 1499.00,
        "description": "Crisp formal shirt woven from long-staple cotton with a spread collar, single chest pocket, and wrinkle-resistant finish.",
        "specifications": {"Fabric": "100% Cotton", "Cuff Style": "Button Cuff", "Weave": "Dobby Oxford", "Collar": "Semi-Cutaway"},
        "primary_image": "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Fashion",
        "name": "Zara Oversized Linen Casual Blazer",
        "brand": "Zara",
        "sku": "PN-FAS-008",
        "price": 5590.00,
        "description": "Lightweight breathable linen blend blazer with notched lapels, patch front pockets, and an effortlessly relaxed silhouette.",
        "specifications": {"Blend": "55% Linen, 45% Cotton", "Lining": "Viscose", "Fit": "Relaxed Oversized", "Care": "Dry Clean"},
        "primary_image": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80"
        ]
    },

    # -------------------------------------------------------------
    # 3. Grocery (8 products)
    # -------------------------------------------------------------
    {
        "category": "Grocery",
        "name": "India Gate Basmati Rice Feast Rozzana 5kg",
        "brand": "India Gate",
        "sku": "PN-GRO-001",
        "price": 499.00,
        "description": "Aged authentic long-grain basmati rice with distinctive aroma and fluffy non-sticky grains, perfect for daily meals and biryani.",
        "specifications": {"Net Weight": "5 kg", "Grain Length": "Long Grain", "Packaging": "Pouch Pack", "Dietary": "Vegetarian"},
        "primary_image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Grocery",
        "name": "Tata Sampann Unpolished Toor Dal 1kg",
        "brand": "Tata Sampann",
        "sku": "PN-GRO-002",
        "price": 185.00,
        "description": "100% unpolished toor dal rich in natural protein and dietary fiber, processed without artificial polishing for authentic wholesome flavor.",
        "specifications": {"Weight": "1 kg", "Processing": "Unpolished", "Nutritional Value": "Rich in Dietary Protein", "Type": "Toor / Arhar Dal"},
        "primary_image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Grocery",
        "name": "Aashirvaad Shudh Chakki Atta 10kg",
        "brand": "Aashirvaad",
        "sku": "PN-GRO-003",
        "price": 465.00,
        "description": "Made from the finest heavy grains sourced across Indian wheat fields, delivering soft rotis with dietary fiber and essential nutrients.",
        "specifications": {"Net Quantity": "10 kg", "Ingredient": "100% Whole Wheat", "Stone Ground": "Chakki Processed", "Shelf Life": "3 Months"},
        "primary_image": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Grocery",
        "name": "Fortune Sunlite Refined Sunflower Oil 5 Litre Can",
        "brand": "Fortune",
        "sku": "PN-GRO-004",
        "price": 680.00,
        "description": "Light, healthy edible cooking oil fortified with Vitamin A and Vitamin D, enriched with polyunsaturated fatty acids for cardiovascular well-being.",
        "specifications": {"Volume": "5 Litres", "Form": "Refined Sunflower Oil", "Fortified": "Vitamins A & D", "Packaging": "Jar with Handle"},
        "primary_image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Grocery",
        "name": "Amul Pure Cow Ghee 1 Litre Tin",
        "brand": "Amul",
        "sku": "PN-GRO-005",
        "price": 640.00,
        "description": "Traditional pure cow clarified butter with golden granular texture and rich aroma, crafted from fresh cow milk cream.",
        "specifications": {"Volume": "1 Litre", "Source": "100% Pure Cow Milk", "Packaging": "Sealed Tin", "Vegetarian": "Yes"},
        "primary_image": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Grocery",
        "name": "Tata Tea Gold Royal Taste Tea Leaves 1kg",
        "brand": "Tata Tea",
        "sku": "PN-GRO-006",
        "price": 540.00,
        "description": "Exquisite blend of fine valley CTC teas with gently rolled 15% long leaves for full-bodied strength and captivating aroma.",
        "specifications": {"Weight": "1 kg", "Type": "Black Tea CTC with Long Leaves", "Flavour": "Rich Aromatic", "Origin": "Assam Valleys"},
        "primary_image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Grocery",
        "name": "Nescafe Classic Instant Coffee Jar 200g",
        "brand": "Nescafe",
        "sku": "PN-GRO-007",
        "price": 680.00,
        "description": "100% pure natural coffee made from signature medium-dark roasted Robusta beans for the familiar rich aroma and refreshing bold taste.",
        "specifications": {"Net Quantity": "200 g", "Roast Level": "Medium Dark", "Form": "Instant Granules", "Packaging": "Glass Jar"},
        "primary_image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Grocery",
        "name": "Happilo 100% Natural California Almonds 500g",
        "brand": "Happilo",
        "sku": "PN-GRO-008",
        "price": 499.00,
        "description": "Premium California raw badam nuts rich in Vitamin E, magnesium, and dietary protein, packaged in ziplock freshness pouches.",
        "specifications": {"Weight": "500 g", "Grade": "Premium California", "Nutrients": "High Vitamin E & Protein", "Preservatives": "Zero Added"},
        "primary_image": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80"
        ]
    },

    # -------------------------------------------------------------
    # 4. Home & Kitchen (8 products)
    # -------------------------------------------------------------
    {
        "category": "Home & Kitchen",
        "name": "Prestige Deluxe Alpha Stainless Steel Pressure Cooker 3L",
        "brand": "Prestige",
        "sku": "PN-HOK-001",
        "price": 2490.00,
        "description": "Heavy-gauge stainless steel pressure cooker featuring an Alpha induction bottom, controlled gasket release system, and sturdy heat-resistant handles.",
        "specifications": {"Capacity": "3 Litres", "Material": "Grade 304 Stainless Steel", "Induction Compatible": "Yes", "Warranty": "5 Years"},
        "primary_image": "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Home & Kitchen",
        "name": "Philips Daily Collection 750W Mixer Grinder (3 Jars)",
        "brand": "Philips",
        "sku": "PN-HOK-002",
        "price": 3899.00,
        "description": "Robust 750W motor with Turbo torque density for grinding tough Indian spices, idli batter, and chutneys with three leak-proof stainless steel jars.",
        "specifications": {"Power": "750 Watts", "Jars": "3 SS Jars (1.5L, 1L, 0.3L)", "Blades": "Rust-free Stainless Steel"},
        "primary_image": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Home & Kitchen",
        "name": "Pigeon by Stovekraft 1.5L Stainless Steel Electric Kettle",
        "brand": "Pigeon",
        "sku": "PN-HOK-003",
        "price": 799.00,
        "description": "Fast-boiling cordless electric kettle with 1500W heating element, 360-degree swivel base, auto shut-off, and boil-dry safety protection.",
        "specifications": {"Capacity": "1.5 Litres", "Power": "1500 Watts", "Safety": "Auto Cut-Off", "Body": "Brushed Stainless Steel"},
        "primary_image": "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Home & Kitchen",
        "name": "Hawkins Futura Hard Anodised Non-Stick Frying Pan 26cm",
        "brand": "Hawkins",
        "sku": "PN-HOK-004",
        "price": 1425.00,
        "description": "Durable 26cm fry pan with stay-cool stainless steel handles, extra-thick 3.25mm hard anodised base, and premium non-stick coating.",
        "specifications": {"Diameter": "26 cm", "Thickness": "3.25 mm", "Coating": "PFOA-Free German Non-Stick", "Handle": "Stay-Cool Riveted"},
        "primary_image": "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Home & Kitchen",
        "name": "Milton Thermosteel Flip Lid Insulated Flask 1000ml",
        "brand": "Milton",
        "sku": "PN-HOK-005",
        "price": 1050.00,
        "description": "Double-walled vacuum insulated bottle keeping beverages hot or cold for 24 hours, crafted from 100% rust-proof grade 304 steel.",
        "specifications": {"Capacity": "1000 ml", "Insulation": "24h Hot & Cold", "Body": "SUS 304 Steel", "Lid": "Flip-Up Pour Lid"},
        "primary_image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Home & Kitchen",
        "name": "Cello Checkers Airtight Plastic Container Set of 18",
        "brand": "Cello",
        "sku": "PN-HOK-006",
        "price": 899.00,
        "description": "BPA-free modular pantry storage containers with airtight seal lids to protect pulses, spices, and snacks from moisture and insects.",
        "specifications": {"Units": "18 Pieces (300ml, 650ml, 1200ml)", "Material": "100% Food Grade BPA-Free", "Airtight": "Yes"},
        "primary_image": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Home & Kitchen",
        "name": "Bombay Dyeing 100% Pure Cotton King Size Bedsheet",
        "brand": "Bombay Dyeing",
        "sku": "PN-HOK-007",
        "price": 1699.00,
        "description": "Luxurious 200 thread-count king bedsheet with matching pillow covers in serene floral prints, offering breathable year-round comfort.",
        "specifications": {"Size": "King (274 cm x 274 cm)", "Thread Count": "200 TC", "Includes": "1 Bedsheet + 2 Pillow Covers"},
        "primary_image": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Home & Kitchen",
        "name": "Borosil Carafe with Strainer in Lid Glass Teapot 1L",
        "brand": "Borosil",
        "sku": "PN-HOK-008",
        "price": 745.00,
        "description": "Flame-proof 100% borosilicate glass carafe with built-in stainless steel tea infuser lid, safe for microwave, gas stove, and dishwasher.",
        "specifications": {"Volume": "1000 ml", "Glass Type": "100% Borosilicate", "Flame Proof": "Yes", "Thermal Shock Resistance": "Up to 350°C"},
        "primary_image": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=80"
        ]
    },

    # -------------------------------------------------------------
    # 5. Beauty & Personal Care (8 products)
    # -------------------------------------------------------------
    {
        "category": "Beauty & Personal Care",
        "name": "Himalaya Purifying Neem Face Wash 400ml",
        "brand": "Himalaya",
        "sku": "PN-BPC-001",
        "price": 380.00,
        "description": "Soap-free herbal formulation that clears impurities and helps control pimples through the antibacterial synergy of Neem and Turmeric.",
        "specifications": {"Volume": "400 ml", "Skin Type": "Oily to Acne-Prone", "Key Ingredients": "Neem, Turmeric", "Formula": "Soap-Free Gel"},
        "primary_image": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Beauty & Personal Care",
        "name": "Minimalist 10% Niacinamide Face Serum with Zinc 30ml",
        "brand": "Minimalist",
        "sku": "PN-BPC-002",
        "price": 599.00,
        "description": "Nourishing daily serum formulated with pure Vitamin B3 and antibacterial Zinc PCA to balance sebum, fade acne marks, and strengthen barrier.",
        "specifications": {"Quantity": "30 ml", "Active": "10% Niacinamide + 1% Zinc", "pH": "5.5 - 6.5", "Fragrance-Free": "Yes"},
        "primary_image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Beauty & Personal Care",
        "name": "Forest Essentials Soundarya Radiance Cream SPF 25 50g",
        "brand": "Forest Essentials",
        "sku": "PN-BPC-003",
        "price": 5400.00,
        "description": "Ayurvedic day moisturizer infused with 24K gold bhasma, saffron, and cold-pressed botanical oils for luminous firm skin with sun protection.",
        "specifications": {"Net Weight": "50 g", "Hero Ingredients": "24 Karat Gold, Saffron, Ashwagandha", "SPF": "SPF 25 PA++"},
        "primary_image": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Beauty & Personal Care",
        "name": "Biotique Bio Kelp Protein Shampoo For Falling Hair 650ml",
        "brand": "Biotique",
        "sku": "PN-BPC-004",
        "price": 435.00,
        "description": "Invigorating blend of pure kelp, natural proteins, peppermint oil, and mint extract to gently cleanse and encourage thicker healthy hair growth.",
        "specifications": {"Net Volume": "650 ml", "Hair Concern": "Anti-Hairfall & Strengthening", "Ingredients": "Sea Kelp, Bhringraj, Neem"},
        "primary_image": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Beauty & Personal Care",
        "name": "NIVEA Soft Light Moisturizing Cream 300ml",
        "brand": "Nivea",
        "sku": "PN-BPC-005",
        "price": 399.00,
        "description": "Non-greasy, fast-absorbing daily cream with Jojoba Oil and Vitamin E for wonderfully soft, supple face, hand, and body skin.",
        "specifications": {"Volume": "300 ml", "Enriched With": "Jojoba Oil & Vitamin E", "Texture": "Light Whipped Gel-Cream"},
        "primary_image": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Beauty & Personal Care",
        "name": "The Derma Co 1% Hyaluronic Sunscreen Aqua Gel SPF 50",
        "brand": "The Derma Co",
        "sku": "PN-BPC-006",
        "price": 499.00,
        "description": "Broad spectrum PA++++ sunscreen with ultra-lightweight water-like gel consistency that leaves zero white cast while deeply hydrating.",
        "specifications": {"Net Weight": "50 g", "Protection": "SPF 50 PA++++", "Hero Actives": "1% Hyaluronic Acid & Vitamin E"},
        "primary_image": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Beauty & Personal Care",
        "name": "Philips AquaTouch Wet & Dry Men's Electric Shaver (S1121)",
        "brand": "Philips",
        "sku": "PN-BPC-007",
        "price": 2195.00,
        "description": "ComfortCut rotary blade shaver with 3D floating heads, skin protection guard, 40-minute cordless run time, and IPX7 fully washable body.",
        "specifications": {"Battery Run Time": "40 Mins", "Head Type": "3D Floating ComfortCut", "Washable": "100% Waterproof IPX7"},
        "primary_image": "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Beauty & Personal Care",
        "name": "Maybelline New York Colossal Waterproof Mascara 9.2ml",
        "brand": "Maybelline",
        "sku": "PN-BPC-008",
        "price": 449.00,
        "description": "Colossal volume mascara with collagen-infused formula and mega brush for bold, clump-free lashes that resist water, sweat, and smudges.",
        "specifications": {"Volume": "9.2 ml", "Formula": "Waterproof Collagen Enriched", "Shade": "Glam Black", "Wear": "Up to 24 Hours"},
        "primary_image": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80"
        ]
    },

    # -------------------------------------------------------------
    # 6. Accessories (8 products)
    # -------------------------------------------------------------
    {
        "category": "Accessories",
        "name": "Wildcraft 45L Unisex Travel Rucksack Backpack",
        "brand": "Wildcraft",
        "sku": "PN-ACC-001",
        "price": 2899.00,
        "description": "Ergonomic multi-compartment travel rucksack built from water-resistant ripstop fabric with padded back airflow channels and sternum straps.",
        "specifications": {"Capacity": "45 Litres", "Material": "Polyester Ripstop", "Rain Cover": "Included", "Compartments": "3 Main + 2 Side"},
        "primary_image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Accessories",
        "name": "Fastrack Men's Genuine Leather Bifold Wallet Brown",
        "brand": "Fastrack",
        "sku": "PN-ACC-002",
        "price": 1295.00,
        "description": "Handcrafted vintage brown bifold wallet made from 100% genuine pull-up leather with RFID-blocking lining, 8 card slots, and dual currency pockets.",
        "specifications": {"Material": "100% Genuine Leather", "RFID Protection": "Yes", "Card Slots": "8 Slots + 1 Coin Pocket", "Colour": "Dark Brown"},
        "primary_image": "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Accessories",
        "name": "Skybags Trooper 55cm Cabin Hard Luggage Trolley",
        "brand": "Skybags",
        "sku": "PN-ACC-003",
        "price": 2699.00,
        "description": "Sturdy cabin spinner luggage made from crack-resistant polycarbonate shell, featuring 360-degree 4-wheel mobility and recessed TSA lock.",
        "specifications": {"Dimensions": "55 cm (Cabin Approved)", "Material": "Polycarbonate", "Wheels": "4 Multi-directional Wheels"},
        "primary_image": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Accessories",
        "name": "Ray-Ban Aviator Classic Green Lens Sunglasses",
        "brand": "Ray-Ban",
        "sku": "PN-ACC-004",
        "price": 8590.00,
        "description": "Timeless teardrop aviator frame in polished gold-tone metal with crystal green G-15 UV-protection lenses for optimal visual clarity.",
        "specifications": {"Frame": "Gold Metal", "Lens": "G-15 Crystal Green", "Protection": "100% UV400", "Frame Size": "58 mm Standard"},
        "primary_image": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Accessories",
        "name": "Titan Neo Analog Black Dial Stainless Steel Watch",
        "brand": "Titan",
        "sku": "PN-ACC-005",
        "price": 3995.00,
        "description": "Sophisticated men's dress watch with mineral glass, deep black textured dial, quartz movement, and solid stainless steel silver bracelet.",
        "specifications": {"Movement": "High-Precision Quartz", "Case Diameter": "42 mm", "Water Resistance": "50m", "Strap": "Stainless Steel"},
        "primary_image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Accessories",
        "name": "Hidesign Women's Handcrafted Leather Shoulder Tote Bag",
        "brand": "Hidesign",
        "sku": "PN-ACC-006",
        "price": 6495.00,
        "description": "Premium vegetable-tanned genuine leather tote featuring brass fittings, twin shoulder straps, and padded compartment for 13-inch tablet.",
        "specifications": {"Leather": "100% Vegetable Tanned", "Lining": "Striped Cotton Twill", "Closure": "Top Zip Closure", "Hardware": "Solid Brass"},
        "primary_image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Accessories",
        "name": "Tommy Hilfiger Men's Reversible Leather Belt Black/Brown",
        "brand": "Tommy Hilfiger",
        "sku": "PN-ACC-007",
        "price": 2199.00,
        "description": "Versatile two-in-one reversible dress belt with polished twist buckle, providing sleek black on one side and warm brown on the reverse.",
        "specifications": {"Width": "35 mm", "Material": "Genuine Split Leather", "Buckle": "Rotational Gunmetal Buckle"},
        "primary_image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80"
        ]
    },
    {
        "category": "Accessories",
        "name": "Noise ColorFit Pulse 2 Max 1.85-inch Calling Smartwatch",
        "brand": "Noise",
        "sku": "PN-ACC-008",
        "price": 1699.00,
        "description": "Large 1.85-inch TFT display smartwatch with TruSync Bluetooth calling, 550 nits brightness, 100 sports modes, and 10-day battery life.",
        "specifications": {"Display": "1.85-inch 550 Nits", "Battery Life": "Up to 10 Days", "Sensors": "Heart Rate, SpO2, Sleep Tracker"},
        "primary_image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=700&q=80",
        "additional_images": [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"
        ]
    }
]

def verify_images():
    print(f"Total curated products: {len(curated_products)}")
    category_counts = {}
    for p in curated_products:
        cat = p["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    print("\nCategory breakdown:")
    for cat, cnt in category_counts.items():
        print(f"  {cat}: {cnt}")

    print("\nChecking HTTP access for all primary and additional images...")
    broken = []
    checked = 0
    headers = {"User-Agent": "Mozilla/5.0"}

    for p in curated_products:
        urls = [p["primary_image"]] + p.get("additional_images", [])
        for url in urls:
            checked += 1
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=8) as resp:
                    if resp.status != 200:
                        broken.append((p["name"], url, f"Status: {resp.status}"))
                    else:
                        pass
            except Exception as e:
                broken.append((p["name"], url, str(e)))

    print(f"Total images checked: {checked}")
    if broken:
        print(f"FAILED: Found {len(broken)} broken image URLs:")
        for b in broken:
            print(" ", b)
    else:
        print("SUCCESS! All 100% of product images returned HTTP 200 OK and are valid!")

if __name__ == "__main__":
    verify_images()
