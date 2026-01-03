import React from "react";
import { offerProducts } from "../../utils/constants";
import { Link } from "react-router-dom";

const CircularCategorySlider = () => {
  return (
    <section className="bg-white pb-10 pt-4">
      <div className="w-11/12 mx-auto overflow-x-auto no-scrollbar">
        <div className="flex gap-8 md:gap-12 min-w-max justify-center">
          {offerProducts.slice(0, 8).map((item, index) => (
            <Link
              to={`/products?category=${item.name}`}
              key={index}
              className="flex flex-col items-center gap-3 group min-w-[100px]"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#bf9847] transition-all duration-300">
                <img
                  draggable="false"
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  src={item.image}
                  alt={item.name}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 tracking-wide uppercase text-center group-hover:text-[#bf9847] transition-colors">
                {item.name.replace(" Sarees", "")} Saree
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CircularCategorySlider;
