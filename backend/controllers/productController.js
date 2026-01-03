const Product = require("../models/productModel");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const SearchFeatures = require("../utils/searchFeatures");
const ErrorHandler = require("../utils/errorHandler");
const cloudinary = require("cloudinary");

// Get All Products
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {
  const resultPerPage = 12;
  const productsCount = await Product.countDocuments();
  // console.log(req.query);

  const searchFeature = new SearchFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await searchFeature.query;
  let filteredProductsCount = products.length;

  searchFeature.pagination(resultPerPage);

  products = await searchFeature.query.clone();

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});

// Get All Products ---Product Sliders
exports.getProducts = asyncErrorHandler(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Get Product Details
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Get All Products ---ADMIN
exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Create Product ---ADMIN
exports.createProduct = asyncErrorHandler(async (req, res, next) => {
  try {
    console.log("=== Creating Product ===");

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "price",
      "cuttedPrice",
      "category",
      "stock",
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return next(new ErrorHandler(`Please provide ${field}`, 400));
      }
    }

    // Handle images - OPTIONAL
    let imagesLink = [];

    // Option 1: Accept Cloudinary URLs directly
    if (req.body.imageUrls) {
      const urls = req.body.imageUrls
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      urls.forEach((url) => {
        imagesLink.push({
          public_id: new URL(url).pathname
            .split("/")
            .pop()
            .replace(/\.[^.]+$/, ""),
          url: url,
        });
      });

      if (imagesLink.length > 0) {
        console.log(`Added ${imagesLink.length} image URLs from Cloudinary`);
      }
    }

    // Option 2: Handle file uploads (legacy, disabled for now)
    let images = req.body.images;
    if (images && images.length > 0) {
      console.log(`Attempting to upload ${images.length} images...`);
      // If images provided, try to upload (but don't fail if it doesn't work)
      // For now, skip image uploads via FormData - too problematic with base64
      console.log(
        "Image upload via FormData is currently disabled. Use Cloudinary URLs instead."
      );
    }

    // Handle logo - OPTIONAL
    let brandLogo = {};
    if (req.body.logoUrl) {
      brandLogo = {
        public_id: new URL(req.body.logoUrl).pathname
          .split("/")
          .pop()
          .replace(/\.[^.]+$/, ""),
        url: req.body.logoUrl,
      };
      console.log("Added brand logo from Cloudinary URL");
    } else if (req.body.logo) {
      console.log(
        "Logo provided but will be skipped. Use Cloudinary URLs instead."
      );
      // Skip logo upload for now
    }

    // Set brand
    req.body.brand = {
      name: req.body.brandname || "Default Brand",
      logo: brandLogo,
    };

    // Set images
    req.body.images = imagesLink;
    req.body.user = req.user.id;

    // Handle specifications
    let specs = [];
    if (req.body.specifications) {
      if (Array.isArray(req.body.specifications)) {
        req.body.specifications.forEach((s) => {
          try {
            const parsed = typeof s === "string" ? JSON.parse(s) : s;
            if (parsed && parsed.title && parsed.description) {
              specs.push(parsed);
            }
          } catch (e) {
            console.warn("Could not parse specification:", s);
          }
        });
      }
    }
    req.body.specifications = specs;

    // Handle highlights
    if (req.body.highlights && typeof req.body.highlights === "string") {
      req.body.highlights = [req.body.highlights];
    }

    console.log("Creating product:", {
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      specsCount: specs.length,
      highlightsCount: req.body.highlights ? req.body.highlights.length : 0,
    });

    const product = await Product.create(req.body);

    console.log("✓ Product created successfully:", product._id);

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("✗ Product creation error:", error.message);
    return next(
      new ErrorHandler(error.message || "Failed to create product", 500)
    );
  }
});

// Update Product ---ADMIN
exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  // Handle Cloudinary URLs
  if (req.body.imageUrls) {
    const urls = req.body.imageUrls
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const imagesLink = [];
    urls.forEach((url) => {
      imagesLink.push({
        public_id: new URL(url).pathname
          .split("/")
          .pop()
          .replace(/\.[^.]+$/, ""),
        url: url,
      });
    });

    if (imagesLink.length > 0) {
      req.body.images = imagesLink;
      console.log(`Updated ${imagesLink.length} image URLs from Cloudinary`);
    }
  } else if (req.body.images !== undefined) {
    // Original image upload logic
    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    const imagesLink = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLink.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
    req.body.images = imagesLink;
  }

  // Handle logo URL
  if (req.body.logoUrl) {
    const brandLogo = {
      public_id: new URL(req.body.logoUrl).pathname
        .split("/")
        .pop()
        .replace(/\.[^.]+$/, ""),
      url: req.body.logoUrl,
    };
    req.body.brand = {
      name: req.body.brandname || product.brand.name,
      logo: brandLogo,
    };
  } else if (req.body.logo && req.body.logo.length > 0) {
    // Original logo upload logic
    await cloudinary.v2.uploader.destroy(product.brand.logo.public_id);
    const result = await cloudinary.v2.uploader.upload(req.body.logo, {
      folder: "brands",
    });
    const brandLogo = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    req.body.brand = {
      name: req.body.brandname,
      logo: brandLogo,
    };
  }

  let specs = [];
  if (req.body.specifications && Array.isArray(req.body.specifications)) {
    req.body.specifications.forEach((s) => {
      try {
        specs.push(typeof s === "string" ? JSON.parse(s) : s);
      } catch (e) {
        console.warn("Could not parse specification:", s);
      }
    });
    req.body.specifications = specs;
  }

  req.body.user = req.user.id;

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(201).json({
    success: true,
    product,
  });
});

// Delete Product ---ADMIN
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await product.remove();

  res.status(201).json({
    success: true,
  });
});

// Create OR Update Reviews
exports.createProductReview = asyncErrorHandler(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  const isReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of Product
exports.getProductReviews = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Reveiws
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings: Number(ratings),
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
