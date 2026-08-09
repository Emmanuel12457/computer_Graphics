#include <iostream>
#include "sphere.h"
#include "hitable_list.h"
#include "camera.h"
#include "metal.h"
#include "hitable.h"
#include "lambertian.h"
#include "dielectric.h"
#include <fstream>   
#include <sstream>   
#include <iomanip>   
#include <cmath>     


// Recursively traces a ray through the scene and returns the color it picks up.
// depth limits how many times a ray can bounce (prevents infinite recursion).
vec3 color(const ray& r, hitable *world, int depth){
    hit_record rec;
    if(world -> hit(r, 0.001, MAXFLOAT, rec)){
        ray scattered;
        vec3 attenuation;
        // If we haven't hit the bounce limit and the material decides to scatter
        // the ray (reflect/refract/diffuse), recurse to trace the bounced ray.
        if (depth < 50 && rec.mat_ptr -> scatter(r, rec, attenuation, scattered)){
            return attenuation * color(scattered, world, depth +1);
        }
        else{
            // Ray was absorbed (e.g. scatter failed) — contributes no light.
            return vec3(0,0,0);
        }
    }
    else{
        // Ray hit nothing — return a sky gradient based on the ray's vertical direction.
        // t=0 at the horizon (white), t=1 straight up (blue).
        vec3 unit_direction = unit_vector(r.direction());
        float  t = 0.5 * (unit_direction.y() + 1.0);
        return (1.0-t)*vec3(1.0, 1.0, 1.0) + t * vec3(0.5, 0.7, 1.0);
    }
}

// Builds the full scene: one big ground sphere, ~500 small random spheres
// with randomly chosen materials, and three larger  spheres.
hitable *random_scene() {
    int n = 500;
    hitable **list = new hitable*[n+1];

    // The ground: a giant sphere so large its surface reads as a flat plane.
    list[0] = new sphere(vec3(0,-1000,0), 1000, new lambertian(vec3(0.5,0.5,0.5)));

    int i = 1;
    // Scatter small spheres across an 22x22 grid, each nudged by a random offset.
    for (int a = -11; a < 11; a++) {
        for (int b = -11; b < 11; b++) {
            float choose_mat = drand48();
            vec3 center(a+0.9*drand48(), 0.2, b+0.9*drand48());

            // Skip spheres that would overlap the big feature sphere at (4, 0.2, 0).
            if ((center - vec3(4,0.2,0)).length() > 0.9) {
                if (choose_mat < 0.8) {
                    // 80% chance: diffuse (matte) material with a random color.
                    list[i++] = new sphere(center, 0.2,
                        new lambertian(vec3(drand48()*drand48(), drand48()*drand48(), drand48()*drand48())));
                } else if (choose_mat < 0.95) {
                    // 15% chance: metal (reflective) material with random color/fuzziness.
                    list[i++] = new sphere(center, 0.2,
                        new metal(vec3(0.5*(1+drand48()), 0.5*(1+drand48()), 0.5*(1+drand48())), 0.5*drand48()));
                } else {
                    // 5% chance: glass (dielectric) material.
                    list[i++] = new sphere(center, 0.2, new dielectric(1.5));
                }
            }
        }
    }

    
    list[i++] = new sphere(vec3(0,1,0), 1.0, new lambertian(vec3(1,1,1)));
    list[i++] = new sphere(vec3(-4,1,0), 1.0, new lambertian(vec3(0.4,0.2,1)));
    list[i++] = new sphere(vec3(4,1,0), 1.0, new metal(vec3(0.7,0.6,0.5), 0.0));

    return new hitable_list(list, i);
};

int main(int argc, char** argv){

    // This program renders exactly ONE frame per run, chosen via the command line,
    // e.g. `./raytracer 20` renders frame 20 and writes frame_020.ppm.
    // To render a full animation, this binary needs to be run once per frame
    // number (see README for the loop/parallel commands).
    if(argc != 2){
       std::cerr << "Usage: ./raytracer <frame>\n";
        return 1;  
    }
    int frame = std :: stoi(argv[1]);

    // Image and quality settings (kept lower than the original single-image
    // render for faster animation test renders — bump up for a final pass).
    int nx = 400;          // image width in pixels
    int ny = 267;          // image height in pixels
    int ns = 100;           // samples per pixel (anti-aliasing quality)
    int num_frames = 60;   // total frames in the full orbit

    // Fixed seed BEFORE building the scene: guarantees every frame gets the
    // exact same random sphere layout, since this program restarts fresh
    // (and re-seeds drand48) on every single frame render.
    srand48(12345);
    hitable *world = random_scene();
    
    // Build a filename like "frame_020.ppm" using the frame number, zero-padded to 3 digits.
    std::ostringstream filename;
    filename << "frame_"  << std::setfill('0') << std::setw(3) << frame  << ".ppm";
    std::ofstream outfile(filename.str());
    outfile << "P3\n" << nx << " " << ny << "\n" << "255\n";   // required PPM header

    // --- Camera orbit setup ---
    // angle sweeps from 0 to 2*PI as `frame` goes from 0 to num_frames,
    // completing exactly one full circle around the scene.
    float angle = frame * (2.0 * M_PI / num_frames);
    float radius = 13.0;   // horizontal distance from the scene center
    float height = 4.0;    // fixed camera height — stays constant every frame

    // Camera position moves around a circle of radius `radius` at constant `height`,
    // while always looking back at the origin (see `lookat` below).
    vec3 lookfrom(
        radius * cos(angle),
        height,
        radius * sin(angle)
    );

    vec3 lookat(0, 0, 0);   // camera always points at the scene's center

    camera cam(lookfrom, lookat, vec3(0, 1, 0), 40, float(nx) / float(ny));
    // Re-seed AFTER scene creation, using a per-frame seed: keeps the anti-aliasing
    // noise pattern different (but reproducible) for each frame, while the scene
    // layout itself stays identical across all frames.
    srand48(1000 + frame);

    // Main render loop: for every pixel, average `ns` randomly-jittered samples
    // to produce anti-aliased color, then gamma-correct and write it out.
    for(int j = ny-1; j>= 0; j--){         // rows are written top to bottom
        for(int i = 0; i < nx; i++){       // columns left to right
            vec3 col(0,0,0);
            for(int s = 0; s < ns; s++){
                // Jitter the sample position within the pixel for anti-aliasing.
                float u = float(i + drand48()) / float(nx);
                float v = float(j + drand48()) / float(ny);
                ray r = cam.get_ray(u,v);
                col += color(r, world, 0);
            }
            col /= float(ns);                                  // average the samples
            col = vec3(sqrt(col[0]), sqrt(col[1]), sqrt(col[2])); // gamma correction (gamma 2)
            int ir = int(255.99 * col[0]);
            int ig = int(255.99 * col[1]);
            int ib = int(255.99 * col[2]);
            outfile << ir << " " << ig << " " << ib << "\n";
        }
    }
    outfile.close();
    return 0;

}