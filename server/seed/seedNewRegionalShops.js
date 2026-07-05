/**
 * Seed 3 new regional shops (Punjab, KPK, Balochistan) with 5 products each.
 * Images are uploaded to Cloudinary, and data is saved to MongoDB.
 * 
 * Run: node seed/seedNewRegionalShops.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinary');
const { buildFilterFields } = require('../utils/productFilterUtils');

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

const SHOPS_DATA = [
  {
    region: 'Punjab',
    sellerEmail: 'punjabculture@store.pk',
    sellerName: 'Punjab Cultural Hub Seller',
    shopName: 'Punjab Cultural Hub',
    shopDesc: 'Vibrant and authentic cultural products, textiles, and local crafts from the heart of Punjab.',
    shopLogo: unsplash('1563245372-f21724e3856d'),
    products: [
      {
        name: 'Vibrant Phulkari Dupatta',
        description: 'Vibrant hand-embroidered Punjabi Phulkari dupatta with traditional geometric motifs and heavy mirror borders.',
        category: 'Shawls & Dupattas',
        price: 3500,
        stock: 15,
        src: unsplash('1610030469983-98e550d6193c'),
        culture: 'Traditional Clothing'
      },
      {
        name: 'Hand-painted Multani Vase',
        description: 'Exquisite hand-painted Multani blue pottery vase, depicting classic floral patterns and ethnic clay design.',
        category: 'Handicrafts & Decor',
        price: 2800,
        stock: 10,
        src: unsplash('1612196808214-b8e1d6145a8c'),
        culture: 'Handicrafts'
      },
      {
        name: 'Punjabi Khussa with Tilla Work',
        description: 'Handcrafted leather khussa shoe with shiny golden tilla embroidery, direct from local master cobblers in Sargodha.',
        category: 'Footwear (Chappals)',
        price: 2400,
        stock: 25,
        src: unsplash('1543163521-1bf539c55dd2'),
        culture: 'Traditional Accessories'
      },
      {
        name: 'Lahori Sarson Ka Saag & Makki Atta',
        description: 'Authentic, freshly cooked mustard greens (saag) packed with pure butter, paired with premium organic maize flour.',
        category: 'Local Foods',
        price: 1200,
        stock: 30,
        src: unsplash('1546833999-b9f581a1996d'),
        culture: 'Local Foods'
      },
      {
        name: 'Lawn Cotton Embroidered Kurta',
        description: 'Premium cotton hand-loomed Punjabi kurta with fine embroidery around the collar and sleeves.',
        category: 'Clothing',
        price: 4200,
        stock: 20,
        src: unsplash('1599643477877-530eb83abc8e'),
        culture: 'Traditional Clothing'
      }
    ]
  },
  {
    region: 'KPK',
    sellerEmail: 'khyberpass@store.pk',
    sellerName: 'Khyber Pass Traders Seller',
    shopName: 'Khyber Pass Traders',
    shopDesc: 'Traditional Swati shawls, Peshawari footwear, and regional goods from KPK.',
    shopLogo: unsplash('1603487742131-4160ec999306'),
    products: [
      {
        name: 'Peshawari Chappal (Double Sole)',
        description: 'Classic double-sole Peshawari chappal made of premium cowhide leather, durable, comfortable and stylish.',
        category: 'Footwear (Chappals)',
        price: 4500,
        stock: 20,
        src: unsplash('1603487742131-4160ec999306'),
        culture: 'Cultural Accessories'
      },
      {
        name: 'Woolen Swati Shawl',
        description: 'Warm, handwoven woollen shawl from Swat Valley featuring intricate border embroidery and traditional styles.',
        category: 'Shawls & Dupattas',
        price: 6500,
        stock: 12,
        src: unsplash('1620799140408-edc6dcb6d633'),
        culture: 'Traditional Clothing'
      },
      {
        name: 'Carved Swati Jewelry Box',
        description: 'Beautifully carved walnut wood jewelry box with brass inlay work, handcrafted in Swat.',
        category: 'Handicrafts & Decor',
        price: 3100,
        stock: 8,
        src: unsplash('1582139329536-e7284fece509'),
        culture: 'Handicrafts'
      },
      {
        name: 'Organic Wild Swati Honey',
        description: '100% pure and organic wild berry honey harvested from the pristine forests of Swat valley.',
        category: 'Local Foods',
        price: 1800,
        stock: 40,
        src: unsplash('1587049352846-4a222e784d38'),
        culture: 'Local Foods'
      },
      {
        name: 'Embroidered KPK Waistcoat',
        description: 'Traditional KPK wool waistcoat with subtle embroidery, perfect for festive cultural wear.',
        category: 'Clothing',
        price: 3800,
        stock: 15,
        src: unsplash('1617137968427-85924c800a22'),
        culture: 'Traditional Clothing'
      }
    ]
  },
  {
    region: 'Balochistan',
    sellerEmail: 'balochheritage@store.pk',
    sellerName: 'Balochistan Heritage Crafts Seller',
    shopName: 'Balochistan Heritage Crafts',
    shopDesc: 'Tribal embroidery, mirror work, and authentic regional foods of Balochistan.',
    shopLogo: unsplash('1509319117193-57bab727e09d'),
    products: [
      {
        name: 'Balochi Mirror-Work Dress',
        description: 'Exquisite traditional Balochi dress featuring dense hand-embroidered patterns and signature mirror-work.',
        category: 'Clothing',
        price: 8500,
        stock: 10,
        src: unsplash('1563245372-f21724e3856d'),
        culture: 'Traditional Clothing'
      },
      {
        name: 'Handwoven Balochi Gelim Rug',
        description: 'Traditional flat-weave Balochi gelim rug made of organic sheep wool, featuring bold tribal patterns.',
        category: 'Handicrafts & Decor',
        price: 12000,
        stock: 5,
        src: unsplash('1509319117193-57bab727e09d'),
        culture: 'Handicrafts'
      },
      {
        name: 'Balochi Embroidered Sandals',
        description: 'Comfortable leather sandals featuring colorful hand-stitched Balochi embroidery and durable sole.',
        category: 'Footwear (Chappals)',
        price: 2600,
        stock: 18,
        src: unsplash('1560343090-f0409e92791a'),
        culture: 'Cultural Accessories'
      },
      {
        name: 'Organic Panjgur Dates Box',
        description: 'Premium quality, soft and sweet organic dates directly imported from the orchards of Panjgur, Balochistan.',
        category: 'Local Foods',
        price: 1100,
        stock: 50,
        src: unsplash('1590080875515-8a3a8dc5735e'),
        culture: 'Local Foods'
      },
      {
        name: 'Tribal Silver Choker Necklace',
        description: 'Authentic handmade tribal silver choker necklace with traditional Balochi motifs and blue lapis stones.',
        category: 'Handicrafts & Decor',
        price: 4500,
        stock: 12,
        src: unsplash('1599643478518-a784e5dc4c8f'),
        culture: 'Cultural Accessories'
      }
    ]
  }
];

async function seedNewRegionalShops() {
  await connectDB();

  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary is not configured. Check server/.env variables.');
    process.exit(1);
  }

  console.log('🏁 Starting to seed 3 new regional shops...');

  for (const shopData of SHOPS_DATA) {
    console.log(`\n--------------------------------------------`);
    console.log(`Processing region: ${shopData.region}`);
    console.log(`--------------------------------------------`);

    // 1. Find or create Seller User
    let seller = await User.findOne({ email: shopData.sellerEmail });
    if (seller) {
      console.log(`Seller user already exists: ${shopData.sellerEmail}. Reusing...`);
    } else {
      seller = await User.create({
        name: shopData.sellerName,
        email: shopData.sellerEmail,
        password: 'seller123',
        role: 'seller',
        isApproved: true,
      });
      console.log(`Created seller user: ${shopData.sellerEmail}`);
    }

    // 2. Clean up any existing shop & products for this seller (idempotency)
    const existingShop = await Shop.findOne({ owner: seller._id });
    if (existingShop) {
      console.log(`Found existing shop "${existingShop.name}". Deleting shop and its products for fresh seed...`);
      await Product.deleteMany({ shop: existingShop._id });
      await Shop.deleteOne({ _id: existingShop._id });
    }

    // 3. Upload shop logo to Cloudinary
    console.log(`Uploading shop logo to Cloudinary...`);
    const shopLogoUrl = await uploadToCloudinary(shopData.shopLogo, 'shops');
    console.log(`Uploaded logo successfully: ${shopLogoUrl}`);

    // 4. Create new Shop
    const shop = await Shop.create({
      owner: seller._id,
      name: shopData.shopName,
      description: shopData.shopDesc,
      logo: shopLogoUrl,
      isActive: true,
    });
    console.log(`Created shop: "${shop.name}"`);

    // 5. Verify & Upsert categories used by the shop's products
    for (const p of shopData.products) {
      const catExists = await Category.findOne({ name: p.category });
      if (!catExists) {
        await Category.create({ name: p.category });
        console.log(`Created missing category: "${p.category}"`);
      }
    }

    // 6. Upload product images and insert into MongoDB
    console.log(`Uploading ${shopData.products.length} products to Cloudinary and MongoDB...`);
    for (const p of shopData.products) {
      console.log(`  - Uploading image for product: "${p.name}"`);
      let productImageUrl = '';
      try {
        productImageUrl = await uploadToCloudinary(p.src, 'products');
        console.log(`    Uploaded successfully: ${productImageUrl}`);
      } catch (err) {
        console.warn(`    Failed to upload product image to Cloudinary: ${err.message}. Using fallback.`);
        productImageUrl = p.src; // fallback to unsplash direct URL if upload fails
      }

      const filterFields = buildFilterFields(p);

      await Product.create({
        seller: seller._id,
        shop: shop._id,
        name: p.name,
        description: p.description,
        price: p.price,
        discountPrice: null,
        stock: p.stock,
        image: productImageUrl,
        category: p.category,
        region: shopData.region,
        culture: p.culture,
        colorFamilies: filterFields.colorFamilies,
        seasons: filterFields.seasons,
        variants: filterFields.variants,
        rating: 4.5 + Math.random() * 0.5, // 4.5 to 5.0 rating
        numReviews: 0,
        isPublished: true,
        sellerName: shop.name, // Displayed in product list
      });
    }

    console.log(`Successfully completed seeding for region: ${shopData.region}`);
  }

  console.log('\n============================================');
  console.log('🎉 Seeding successfully completed for all 3 shops!');
  console.log('============================================');

  await mongoose.connection.close();
  process.exit(0);
}

seedNewRegionalShops().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
