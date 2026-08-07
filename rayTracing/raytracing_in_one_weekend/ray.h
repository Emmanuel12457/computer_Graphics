#ifndef RAYH
#define RAYH
#include "vec3.h"

/**
 * A ray is represented by a parametric line in 3D -- P(t) = A + tB
 * where A is the origin
 * B is the direction 
 * t is how far along the line the point is
 */

class ray
{
    public:
    ray(){}
    ray(const vec3& a, const vec3& b){A = a; B = b;}
    vec3 origin() const {return A;}
    vec3 direction() const {return B;} 
    vec3 point_at_parameter(float t) const {return A + (t * B);}

    vec3 A; //origin point
    vec3 B; //direction vector
};
#endif