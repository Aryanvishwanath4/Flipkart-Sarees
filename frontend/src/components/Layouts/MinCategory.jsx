import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link, useLocation } from "react-router-dom";

// Header navigation categories - matches what users see on home page
const headerCategories = [
  "Sarees",
  "Cotton Sarees",
  "Silk Sarees",
  "Designer Sarees",
  "Casual Sarees",
  "Wedding Sarees",
  "Traditional Silk Sarees",
];
const specialItems = ["Accessories", "New Arrivals", "Best Sellers", "Sale"];

const MinCategory = () => {
  const location = useLocation();
  
  // Get current category from URL
  const getCurrentCategory = () => {
    if (location.search) {
      const urlParams = new URLSearchParams(location.search);
      return urlParams.get('category') || "";
    }
    return "";
  };
  
  const currentCategory = getCurrentCategory();

  return (
    <section className="hidden sm:block bg-white w-full px-2 sm:px-12 overflow-hidden border-b mt-20">
      <div className="flex items-center justify-between p-0.5">
        {headerCategories.map((el, i) => (
          <Link
            to={`/products?category=${encodeURIComponent(el)}`}
            key={i}
            className={`text-sm p-2 font-medium flex items-center gap-0.5 group ${
              currentCategory === el 
                ? "text-primary-blue" 
                : "text-gray-800 hover:text-primary-blue"
            }`}
          >
            {el}{" "}
            <span className={currentCategory === el ? "text-primary-blue" : "text-gray-400 group-hover:text-primary-blue"}>
              <ExpandMoreIcon sx={{ fontSize: "16px" }} />
            </span>
          </Link>
        ))}
        {specialItems.map((el, i) => (
          <Link
            to={el === "Accessories" ? "/products" : `/products?category=${encodeURIComponent(el)}`}
            key={`special-${i}`}
            className={`text-sm p-2 font-medium flex items-center gap-0.5 group ${
              currentCategory === el 
                ? "text-primary-blue" 
                : "text-gray-800 hover:text-primary-blue"
            }`}
          >
            {el}{" "}
            <span className={currentCategory === el ? "text-primary-blue" : "text-gray-400 group-hover:text-primary-blue"}>
              <ExpandMoreIcon sx={{ fontSize: "16px" }} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MinCategory;


