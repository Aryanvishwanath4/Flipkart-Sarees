import { useEffect } from "react";
import CircularCategorySlider from "./CircularCategorySlider";
import LargeProductGrid from "./LargeProductGrid";
import { useDispatch, useSelector } from "react-redux";
import { clearErrors, getSliderProducts } from "../../actions/productAction";
import { useSnackbar } from "notistack";
import MetaData from "../Layouts/MetaData";

const Home = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { error, loading } = useSelector((state) => state.products);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }
  }, [dispatch, error, enqueueSnackbar]);

  useEffect(() => {
    dispatch(getSliderProducts());
  }, [dispatch]);

  return (
    <>
      <MetaData title="Aishwarya Silks | Premium Saree Collection" />
      <main className="flex flex-col w-full mt-24 sm:mt-20 bg-white">
        
        {/* Categories Section */}
        <CircularCategorySlider />
        
        {/* Main Product Showcase */}
        <LargeProductGrid />
        
      </main>
    </>
  );
};

export default Home;
