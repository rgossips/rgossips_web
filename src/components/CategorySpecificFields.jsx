"use client";

import { Clock, Users, Wind, Utensils, Cpu, Shirt } from "lucide-react";

const CategorySpecificFields = ({
  category = "",
  specifics = {},
  metadata = {},
}) => {
  const data = { ...(metadata || {}), ...(specifics || {}) };
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  switch (category) {
    case "hotels":
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Stay Details</h3>

          {/* Nights & Days */}
          <div className="grid grid-cols-2 gap-4">
            {data.nights && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 font-medium">
                  Number of Nights
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {data.nights}
                </p>
              </div>
            )}
            {data.days && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 font-medium">
                  Number of Days
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {data.days}
                </p>
              </div>
            )}
          </div>

          {/* Check-in/out Times */}
          {(data.checkInTime || data.checkOutTime) && (
            <div className="grid grid-cols-2 gap-4">
              {data.checkInTime && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <Clock className="text-amber-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      Check-In
                    </p>
                    <p className="font-semibold text-gray-800">
                      {data.checkInTime}
                    </p>
                  </div>
                </div>
              )}
              {data.checkOutTime && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <Clock className="text-amber-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      Check-Out
                    </p>
                    <p className="font-semibold text-gray-800">
                      {data.checkOutTime}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guest Count */}
          {data.guestCount && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
              <Users className="text-green-600" size={20} />
              <div>
                <p className="text-xs text-gray-600 font-medium">
                  Guest Capacity
                </p>
                <p className="font-semibold text-gray-800">{data.guestCount}</p>
              </div>
            </div>
          )}

          {/* Services */}
          {data.services && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs text-gray-600 font-medium mb-2">
                Amenities & Services
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {data.services}
              </p>
            </div>
          )}
        </div>
      );

    case "food":
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Menu Items</h3>
          {data.foodItems && data.foodItems.length > 0 ? (
            <div className="space-y-3">
              {data.foodItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Utensils size={16} className="text-orange-600" />
                        {item.cuisine || "Cuisine"}
                      </h4>
                      {item.allergens && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ Allergens: {item.allergens}
                        </p>
                      )}
                      {item.desc && (
                        <p className="text-sm text-gray-600 mt-2">
                          {item.desc}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {item.cost && (
                        <p className="text-sm font-bold text-green-700">
                          {item.cost}
                        </p>
                      )}
                      {item.persons && (
                        <p className="text-xs text-gray-500 mt-1">
                          Serves: {item.persons}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No menu items available</p>
          )}
        </div>
      );

    case "tech":
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Product Details</h3>
          {data.techItems && data.techItems.length > 0 ? (
            <div className="space-y-3">
              {data.techItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-indigo-50 rounded-lg border border-indigo-100"
                >
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Cpu size={16} className="text-indigo-600" />
                    {item.model || "Device"}
                  </h4>
                  {item.specs && (
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Specs:</span> {item.specs}
                    </p>
                  )}
                  {item.desc && (
                    <p className="text-sm text-gray-600 mt-2">{item.desc}</p>
                  )}
                  {item.price && (
                    <p className="text-sm font-bold text-green-700 mt-2">
                      Market Price: {item.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No products available</p>
          )}
        </div>
      );

    case "fashion":
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Product Collection</h3>
          {data.fashionItems && data.fashionItems.length > 0 ? (
            <div className="space-y-3">
              {data.fashionItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-pink-50 rounded-lg border border-pink-100"
                >
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Shirt size={16} className="text-pink-600" />
                    {item.name || "Product"}
                  </h4>
                  {item.sizes && (
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Available Sizes:</span>{" "}
                      {item.sizes}
                    </p>
                  )}
                  {item.desc && (
                    <p className="text-sm text-gray-600 mt-2">{item.desc}</p>
                  )}
                  {item.price && (
                    <p className="text-sm font-bold text-green-700 mt-2">
                      Price: {item.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No products available</p>
          )}
        </div>
      );

    default:
      return null;
  }
};

export default CategorySpecificFields;
