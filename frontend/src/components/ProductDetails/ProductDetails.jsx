import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  clearErrors,
  getProductDetails,
  getSimilarProducts,
  newReview,
} from "../../actions/productAction";
import ProductSlider from "../Home/ProductSlider/ProductSlider";
import Loader from "../Layouts/Loader";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import StarIcon from "@mui/icons-material/Star";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CachedIcon from "@mui/icons-material/Cached";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Rating from "@mui/material/Rating";
import TextField from "@mui/material/TextField";
import { NEW_REVIEW_RESET } from "../../constants/productConstants";
import { addItemsToCart } from "../../actions/cartAction";
import { getDeliveryDate, getDiscount } from "../../utils/functions";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../actions/wishlistAction";
import MinCategory from "../Layouts/MinCategory";
import MetaData from "../Layouts/MetaData";


const ProductDetails = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const params = useParams();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const { product, loading, error } = useSelector(
    (state) => state.productDetails
  );
  const { success, error: reviewError } = useSelector(
    (state) => state.newReview
  );
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);

  const productId = params.id;

  const itemInCart = cartItems.some((item) => item.product === productId);
  const itemInWishlist = wishlistItems.some((i) => i.product === productId);

  const handleDialogClose = () => {
    setOpen(!open);
  };

  const goToCart = () => {
    navigate("/cart");
  };

  const buyNow = () => {
    if (!product || product.stock < 1) return;
    dispatch(addItemsToCart(productId));
    navigate("/cart");
  };

  const addToWishlistHandler = () => {
    if (itemInWishlist) {
      dispatch(removeFromWishlist(productId));
      enqueueSnackbar("Removed from Wishlist", { variant: "success" });
    } else {
      dispatch(addToWishlist(productId));
      enqueueSnackbar("Added to Wishlist", { variant: "success" });
    }
  };

  const reviewSubmitHandler = () => {
    if (rating === 0 || !comment.trim()) {
      enqueueSnackbar("Please provide rating and comment", {
        variant: "error",
      });
      return;
    }
    const formData = new FormData();
    formData.set("rating", rating);
    formData.set("comment", comment);
    formData.set("productId", productId);
    dispatch(newReview(formData));
    setOpen(false);
  };

  const addToCartHandler = () => {
    dispatch(addItemsToCart(productId));
    enqueueSnackbar("Added to Cart", { variant: "success" });
  };

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }
    if (reviewError) {
      enqueueSnackbar(reviewError, { variant: "error" });
      dispatch(clearErrors());
    }
    if (success) {
      enqueueSnackbar("Review submitted successfully!", { variant: "success" });
      dispatch({ type: NEW_REVIEW_RESET });
    }
  }, [dispatch, error, reviewError, success, enqueueSnackbar]);

  useEffect(() => {
    dispatch(getProductDetails(productId));
  }, [dispatch, productId]);

  useEffect(() => {
    if (product?.category) {
      dispatch(getSimilarProducts(product.category));
    }
  }, [dispatch, product?.category]);

  if (loading) return <Loader />;

  return (
    <>
      <MetaData title={product?.name || "Product Details"} />
      <MinCategory />

      <main className="bg-gray-50 min-h-screen py-4 mt-20 sm:mt-0">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          {/* Main Product Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-8">
              {/* Left Side - Image Gallery */}
              <div className="flex flex-col gap-4">
                {/* Main Image */}
                <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 flex items-center justify-center min-h-96 relative group">
                  <img
                    draggable="false"
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    src={
                      product && product.images && product.images[selectedImage]?.url
                        ? product.images[selectedImage].url
                        : "https://via.placeholder.com/400"
                    }
                    alt={product?.name || "Product Image"}
                  />

                  {/* Wishlist Button */}
                  <button
                    onClick={addToWishlistHandler}
                    className="absolute top-4 right-4 bg-white rounded-full w-11 h-11 shadow-md flex items-center justify-center hover:bg-gray-50 transition"
                  >
                    {itemInWishlist ? (
                      <FavoriteIcon className="text-red-500" />
                    ) : (
                      <FavoriteBorderIcon className="text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Thumbnail Images */}
                {product?.images?.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {product?.images?.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition ${
                          selectedImage === idx
                            ? "border-primary-blue"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          draggable="false"
                          className="w-full h-full object-contain p-1"
                          src={img.url}
                          alt="thumbnail"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side - Product Info */}
              <div className="flex flex-col gap-6">
                {/* Product Title & Rating */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                    {product?.name}
                  </h1>

                  {/* Rating */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 bg-primary-green text-white px-3 py-1 rounded-lg">
                      <span className="font-semibold">
                        {product?.ratings?.toFixed(1) || "0"}
                      </span>
                      <StarIcon sx={{ fontSize: "16px" }} />
                    </div>
                    <span className="text-gray-600 cursor-pointer hover:text-primary-blue">
                      ({product?.numOfReviews || 0} Reviews)
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm">{product?.category}</p>
                </div>

                {/* Price Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ₹{product.price?.toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{product.cuttedPrice?.toLocaleString()}
                    </span>
                    <span className="text-lg font-semibold text-primary-green">
                      {getDiscount(product?.price, product?.cuttedPrice)}% OFF
                    </span>
                  </div>
                  <p className="text-sm text-primary-green font-medium">
                    Inclusive of all taxes
                  </p>
                </div>

                {/* Stock Status */}
                {product?.stock <= 10 && product?.stock > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-orange-700 font-medium text-sm">
                      ⚡ Only {product?.stock} items left in stock
                    </p>
                  </div>
                )}

                {product?.stock === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 font-medium text-sm">
                      Out of Stock
                    </p>
                  </div>
                )}

                {/* Delivery Info */}
                <div className="border-t pt-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-primary-blue text-2xl">📦</span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Delivery by {getDeliveryDate()}
                      </p>
                      <p className="text-sm text-gray-600">Free Delivery</p>
                    </div>
                  </div>
                </div>

                {/* Offers */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <LocalOfferIcon fontSize="small" /> Best Offers
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="text-gray-700">
                      ✓ Bank Offer: 5% Unlimited Cashback on Flipkart Axis Bank
                      Credit Card
                    </li>
                    <li className="text-gray-700">
                      ✓ Special Price: Get extra ₹50 off (price inclusive of
                      cashback/coupon)
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {product?.stock > 0 ? (
                    <>
                      <button
                        onClick={itemInCart ? goToCart : addToCartHandler}
                        className="flex-1 bg-primary-yellow hover:bg-yellow-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <ShoppingCartIcon />
                        {itemInCart ? "GO TO CART" : "ADD TO CART"}
                      </button>
                      <button
                        onClick={buyNow}
                        className="flex-1 bg-primary-orange hover:bg-orange-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <FlashOnIcon />
                        BUY NOW
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white font-bold py-3 rounded-lg cursor-not-allowed"
                    >
                      Out of Stock
                    </button>
                  )}
                </div>

                {/* Brand & Services */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <img
                      draggable="false"
                      className="h-8 object-contain"
                      src={
                        product.brand?.logo?.url ||
                        "https://via.placeholder.com/100"
                      }
                      alt="Brand"
                    />
                    <span className="text-gray-700 font-medium">
                      {product.brand?.name || "Brand Name"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 text-gray-700">
                      <VerifiedUserIcon className="text-primary-blue" />
                      <span>{product?.warranty || 1} Year Warranty</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <CachedIcon className="text-primary-blue" />
                      <span>7 Days Replacement Policy</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <CurrencyRupeeIcon className="text-primary-blue" />
                      <span>Cash on Delivery Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
            {/* Highlights */}
            {product?.highlights && product.highlights.length > 0 && (
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Highlights
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-primary-blue text-lg">✓</span>
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            {product?.description && (
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed line-clamp-4">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specifications */}
            {product?.specifications && product.specifications.length > 0 && (
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Specifications
                </h2>
                <div className="space-y-3">
                  {product.specifications.map((spec, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="w-1/3 text-gray-600 font-medium min-w-fit">
                        {spec.title}
                      </span>
                      <span className="flex-1 text-gray-800">
                        {spec.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Ratings & Reviews
                </h2>
                <button
                  onClick={handleDialogClose}
                  className="bg-primary-yellow hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Rate Product
                </button>
              </div>

              {/* Review Dialog */}
              <Dialog
                aria-labelledby="review-dialog"
                open={open}
                onClose={handleDialogClose}
              >
                <DialogTitle>Submit Your Review</DialogTitle>
                <DialogContent className="flex flex-col gap-4 pt-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Rating</p>
                    <Rating
                      onChange={(e) => setRating(e.target.value)}
                      value={rating}
                      size="large"
                      precision={0.5}
                    />
                  </div>
                  <TextField
                    label="Your Review"
                    multiline
                    rows={4}
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                  />
                </DialogContent>
                <DialogActions>
                  <button
                    onClick={handleDialogClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={reviewSubmitHandler}
                    className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Review
                  </button>
                </DialogActions>
              </Dialog>

              {/* Rating Summary */}
              <div className="flex items-start gap-8 mb-8 pb-8 border-b">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900">
                    {product?.ratings?.toFixed(1) || "0"}
                  </p>
                  <div className="flex items-center gap-1 justify-center my-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={
                          i < Math.round(product?.ratings || 0)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Based on {product?.numOfReviews || 0} reviews
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {(viewAll
                  ? product?.reviews
                  : product?.reviews?.slice(0, 3)
                )?.map((review, idx) => (
                  <div key={idx} className="pb-4 border-b last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Rating value={review.rating} readOnly size="small" />
                        <p className="font-semibold text-gray-900 text-sm mt-1">
                          {review.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                )) || (
                  <p className="text-center text-gray-500 py-8">
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </div>

              {product?.reviews && product.reviews.length > 3 && (
                <button
                  onClick={() => setViewAll(!viewAll)}
                  className="w-full mt-4 py-2 border border-primary-blue text-primary-blue font-semibold rounded-lg hover:bg-blue-50 transition"
                >
                  {viewAll ? "View Less Reviews" : "View All Reviews"}
                </button>
              )}
            </div>
          </div>

          {/* Similar Products */}
          <div className="mb-8">
            <ProductSlider
              title="Similar Sarees"
              tagline="You might like these"
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductDetails;
