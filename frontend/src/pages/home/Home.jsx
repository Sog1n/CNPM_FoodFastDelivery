import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/HomePageCompo/Card";
import { FaBowlFood } from "react-icons/fa6";
import { IoTimerOutline } from "react-icons/io5";
import { BiSolidOffer } from "react-icons/bi";
import { data } from "./RestaurentcardData/foodData";
import logo from "../../assets/food-delivery-main page.avif";
import AOS from 'aos';
import 'aos/dist/aos.css';

const Home = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <>
      <div className="hidden w-full h-[550px] md:grid lg:grid-cols-2 mt-20 bg-yellow-300">
        <div className="h-full flex flex-col items-center ">
          <h1 className="mt-24 ml-7 text-7xl  gap-y-6 flex flex-col font-display font-extrabold">
            <span>One stop</span>
            <span>for all your</span>
            <span>
              <span className="text-green-700">Food </span>
              cravings
            </span>
          </h1>
          <p className="mt-11 ml-10 tracking-[0.01em] text-[20px] font-poppins font-semibold">
            Hungry? Sick of a boring diet plan? We deliver
          </p>
          <p className="ml-12 tracking-[0.01em] text-[20px] font-poppins font-semibold">
            fresh and delicious food right at your doorstep.
          </p>
        </div>
        <div className="h-full">
          <img
            className="ml-20 mt-9 h-[440px] w-[465px] rounded-full shadow-lg transition-transform duration-300 hover:scale-105"
            src={logo}
            alt="food delivery"
          />
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 bg-gradient-to-r from-neutral-100 to-yellow-100" data-aos="fade-up"></div>

     
      <div className="bg-white py-16" data-aos="fade-up">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-display font-bold text-center mb-12">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Quality Assurance", description: "We prioritize freshness and taste in every meal.", icon: <FaBowlFood size={30} className="text-yellow-600" /> },
              { title: "Fast Delivery", description: "Our efficient network ensures your food arrives hot and on time.", icon: <IoTimerOutline size={30} className="text-yellow-600" /> },
              { title: "Wide Selection", description: "Choose from a diverse range of cuisines and restaurants.", icon: <BiSolidOffer size={30} className="text-yellow-600" /> }
            ].map((item, index) => (
              <div key={index} className="bg-yellow-100 rounded-lg shadow-lg p-6" data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="flex justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-center text-yellow-600">{item.title}</h3>
                <p className="text-gray-700 text-center">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h1 className="ml-36 mt-10 font-extrabold text-4xl font-display" data-aos="fade-right">
        Restaurants for you 123
      </h1>
      <div className="hidden md:grid grid-cols-4 mx-16 my-6 pl-20 pt-6 pb-10 gap-y-12">
        {data.map((food, index) => (
          <div key={index} data-aos="fade-up" data-aos-delay={index * 50}>
            <Link to="/UserLogin">
              <Card
                src={food.src}
                restaurant={food.restaurant}
                cuisine={food.cuisine}
                rating={food.rating}
                address={food.address}
              />
            </Link>
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
