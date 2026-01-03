import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "../../actions/productAction";
import { addToWishlist, removeFromWishlist } from "../../actions/wishlistAction";
import { useSnackbar } from "notistack";

const LargeProductGrid = () => {
  const dispatch = useDispatch();
  const { loading, products } = useSelector((state) => state.products);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const { enqueueSnackbar } = useSnackbar();

  const addToWishlistHandler = (e, id) => {
    e.preventDefault();
    const itemInWishlist = wishlistItems.some((i) => i.product === id);
    if (itemInWishlist) {
      dispatch(removeFromWishlist(id));
      enqueueSnackbar("Remove From Wishlist", { variant: "success" });
    } else {
      dispatch(addToWishlist(id));
      enqueueSnackbar("Added To Wishlist", { variant: "success" });
    }
  };

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  return (
    <section className="bg-[#fffbf7]"> {/* Light cream background for premium feel */}
      <h2 className="text-3xl md:text-4xl text-center font-serif text-[#101828] mb-10 tracking-wide">
        Sarees for Women
      </h2>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4 sm:px-6 max-w-[1600px] mx-auto">
          {products && products.slice(0, 8).map((product) => {
            const itemInWishlist = wishlistItems.some((i) => i.product === product._id);
            return (
            <Link 
              key={product._id} 
              to={`/product/${product._id}`}
              className="group relative bg-white overflow-hidden cursor-pointer block"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  draggable="false"
                  src={product.images && product.images[0] ? product.images[0].url : "https://via.placeholder.com/300"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Wishlist Icon */}
                <button 
                  onClick={(e) => addToWishlistHandler(e, product._id)}
                  className="absolute top-4 right-4 bg-white/80 p-2 rounded-full text-gray-700 hover:text-red-500 hover:bg-white transition-all shadow-sm"
                >
                  {itemInWishlist ? (
                    <FavoriteIcon sx={{ color: "red" }} />
                  ) : (
                    <FavoriteBorderIcon fontSize="medium" />
                  )}
                </button>
              </div>

              {/* Product Details */}
              <div className="p-4 text-left">
                <h3 className="text-gray-800 font-medium text-base mb-1 truncate">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-[#101828]">
                    {`₹${product.price}`}
                  </span>
                  {product.cuttedPrice && product.cuttedPrice > product.price && (
                     <span className="text-gray-500 line-through text-sm">
                        {`₹${product.cuttedPrice}`}
                     </span>
                  )}
                  {product.cuttedPrice && product.cuttedPrice > product.price && (
                    <span className="text-green-600 text-sm font-medium">
                      {`${Math.round(((product.cuttedPrice - product.price) / product.cuttedPrice) * 100)}% Off`}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 pointer-events-none transition-colors duration-300" />
            </Link>
          )})}
        </div>
      )}
      
      <div className="flex justify-center mt-12">
        <Link to="/products" className="px-8 py-3 border border-[#101828] text-[#101828] font-medium uppercase hover:bg-[#101828] hover:text-white transition-all duration-300 tracking-widest">
            View All Sarees
        </Link>
      </div>
    </section>
  );
};

export default LargeProductGrid;
