import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Searchbar from "./Searchbar";
import logo from "../../../assets/images/AS_Logo.png";
import PrimaryDropDownMenu from "./PrimaryDropDownMenu";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.user);

  const { cartItems } = useSelector((state) => state.cart);

  const [togglePrimaryDropDown, setTogglePrimaryDropDown] = useState(false);

  return (
    <header className="bg-[#101828] fixed top-0 py-4 w-full z-10">
      {/* <!-- navbar container --> */}
      <div className="w-full sm:w-9/12 px-1 sm:px-4 m-auto flex justify-between items-center relative">
        {/* <!-- logo & search container --> */}
        <div className="flex items-center flex-1">
          <Link className="h-12 mr-1 sm:mr-4" to="/">
            <img
              draggable="false"
              className="h-full w-full object-contain"
              src={logo}
              alt="Flipkart Logo"
            />
          </Link>

          <Link to="/" className="mr-4 hidden sm:block decoration-none">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[#bf9847] font-serif text-2xl tracking-wide font-bold leading-none">
                AISHWARYA
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-[1px] w-4 bg-[#bf9847]"></div>
                <span className="text-[#bf9847] font-sans text-[10px] tracking-[0.3em] font-medium leading-none">
                  SILKS
                </span>
                <div className="h-[1px] w-4 bg-[#bf9847]"></div>
              </div>
            </div>
          </Link>

          <Searchbar />
        </div>
        {/* <!-- logo & search container --> */}

        {/* <!-- right navs --> */}
        <div className="flex items-center justify-between ml-4 sm:ml-10 gap-0.5 sm:gap-7 relative">
          {isAuthenticated === false ? (
            <Link
              to="/login"
              className="px-3 sm:px-9 py-0.5 text-primary-blue bg-white border font-medium rounded-sm cursor-pointer"
            >
              Login
            </Link>
          ) : (
            <span
              className="userDropDown flex items-center text-white font-medium gap-1 cursor-pointer"
              onClick={() => setTogglePrimaryDropDown(!togglePrimaryDropDown)}
            >
              {user.name && user.name.split(" ", 1)}
              <span>
                {togglePrimaryDropDown ? (
                  <ExpandLessIcon sx={{ fontSize: "16px" }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: "16px" }} />
                )}
              </span>
            </span>
          )}

          {togglePrimaryDropDown && (
            <PrimaryDropDownMenu
              setTogglePrimaryDropDown={setTogglePrimaryDropDown}
              user={user}
            />
          )}



          <Link
            to="/cart"
            className="flex items-center text-white font-medium gap-2 relative"
          >
            <span>
              <ShoppingCartIcon />
            </span>
            {cartItems.length > 0 && (
              <div className="w-5 h-5 p-2 bg-red-500 text-xs rounded-full absolute -top-2 left-3 flex justify-center items-center border">
                {cartItems.length}
              </div>
            )}
            Cart
          </Link>
        </div>
        {/* <!-- right navs --> */}
      </div>
      {/* <!-- navbar container --> */}
    </header>
  );
};

export default Header;
