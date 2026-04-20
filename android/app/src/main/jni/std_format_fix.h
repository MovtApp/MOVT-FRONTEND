#pragma once
#include <string>
#include <string_view>

namespace std {
    template<typename... Args>
    string format(string_view fmt, Args&&... args) {
        if (fmt == "{}%") {
            // This handles the specific case in graphicsConversions.h
            return to_string(forward<Args>(args)...) + "%";
        }
        return "formatter_error";
    }
}
