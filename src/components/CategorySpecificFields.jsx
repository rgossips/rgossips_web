"use client";

import { Clock, Users, Wind, Utensils, Cpu, Shirt } from "lucide-react";
import { useTranslations } from "next-intl";

const CategorySpecificFields = ({
  category = "",
  specifics = {},
  metadata = {},
}) => {
  const t = useTranslations("CategorySpecificFields");
  const data = { ...(metadata || {}), ...(specifics || {}) };
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  switch (category) {
    case "hotels":
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("hotels.title")}</h3>

          {/* Nights & Days */}
          <div className="grid grid-cols-2 gap-4">
            {data.nights && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 font-medium">
                  {t("hotels.numberOfNights")}
                </p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {data.nights}
                </p>
              </div>
            )}
            {data.days && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 font-medium">
                  {t("hotels.numberOfDays")}
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
                      {t("hotels.checkIn")}
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
                      {t("hotels.checkOut")}
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
                  {t("hotels.guestCapacity")}
                </p>
                <p className="font-semibold text-gray-800">{data.guestCount}</p>
              </div>
            </div>
          )}

          {/* Services */}
          {data.services && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs text-gray-600 font-medium mb-2">
                {t("hotels.amenitiesAndServices")}
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
          <h3 className="text-lg font-semibold">{t("food.title")}</h3>
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
                        {item.cuisine || t("food.cuisineFallback")}
                      </h4>
                      {item.allergens && (
                        <p className="text-xs text-red-600 mt-1">
                          {t("food.allergens", { allergens: item.allergens })}
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
                          {t("food.serves", { persons: item.persons })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{t("food.noItems")}</p>
          )}
        </div>
      );

    case "tech":
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("tech.title")}</h3>
          {data.techItems && data.techItems.length > 0 ? (
            <div className="space-y-3">
              {data.techItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-indigo-50 rounded-lg border border-indigo-100"
                >
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Cpu size={16} className="text-indigo-600" />
                    {item.model || t("tech.deviceFallback")}
                  </h4>
                  {item.specs && (
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">{t("tech.specsLabel")}</span> {item.specs}
                    </p>
                  )}
                  {item.desc && (
                    <p className="text-sm text-gray-600 mt-2">{item.desc}</p>
                  )}
                  {item.price && (
                    <p className="text-sm font-bold text-green-700 mt-2">
                      {t("tech.marketPrice", { price: item.price })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{t("tech.noItems")}</p>
          )}
        </div>
      );

    case "fashion":
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("fashion.title")}</h3>
          {data.fashionItems && data.fashionItems.length > 0 ? (
            <div className="space-y-3">
              {data.fashionItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-pink-50 rounded-lg border border-pink-100"
                >
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Shirt size={16} className="text-pink-600" />
                    {item.name || t("fashion.productFallback")}
                  </h4>
                  {item.sizes && (
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">{t("fashion.availableSizesLabel")}</span>{" "}
                      {item.sizes}
                    </p>
                  )}
                  {item.desc && (
                    <p className="text-sm text-gray-600 mt-2">{item.desc}</p>
                  )}
                  {item.price && (
                    <p className="text-sm font-bold text-green-700 mt-2">
                      {t("fashion.price", { price: item.price })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{t("fashion.noItems")}</p>
          )}
        </div>
      );

    default:
      return null;
  }
};

export default CategorySpecificFields;
