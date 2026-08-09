#ifndef CAMERAH
#define CAMERAH

#include "ray.h"


class camera{
public:
    // Builds a camera from position (lookfrom), target (lookat), an "up" hint
    // (vup), vertical field of view in degrees (vfov), and the image aspect ratio.
    camera(vec3 lookfrom, vec3 lookat, vec3 vup, float vfov, float aspect){
        vec3 u,v,w;
        float theta = vfov*M_PI/180;          // fov in radians
        float half_height = tan(theta/2);     // viewport half-height at distance 1
        float half_width = aspect * half_height;
        origin = lookfrom;

        // Build the camera's own basis vectors: w = backward, u = right, v = up.
        // Letting these depend on lookfrom/lookat/vup means the camera can be
        // pointed anywhere and "up" still behaves correctly.
        w = unit_vector(lookfrom - lookat);
        u = unit_vector(cross(vup, w));
        v = cross(w, u);

        // Corner and span of the virtual viewport, one unit in front of the camera.
        lower_left_corner = origin - half_width * u - half_height * v -w;
        horizontal = 2*half_width * u;
        vertical =  2 * half_height * v;
    }

    // Returns a ray from the camera through viewport coordinates (s, t),
    // where s and t range from 0 to 1 across the image.
    ray get_ray(float s, float t){return ray(origin, lower_left_corner + s*horizontal + t*vertical - origin); }

    vec3 origin;
    vec3 lower_left_corner;
    vec3 horizontal;
    vec3 vertical;
};
#endif