#pragma once
#include <string>
#include <string_view>
#include <utility>

namespace std {
    template<typename... Args>
    string format(string_view fmt, Args&&... args) {
        if (fmt == "{}%") {
            // This handles the specific case in graphicsConversions.h
            return std::to_string(std::forward<Args>(args)...) + "%";
        }
        return "formatter_error";
    }
}
