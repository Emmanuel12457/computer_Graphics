#include <iostream>
#include <math.h>


// kernel function to add the elements of two arrays

void __global__ add(int n, float *x, float *y){
    int  index = blockIdx.x * blockDim.x + threadIdx.x;
    int stride = blockDim.x * gridDim.x;
    for(int i = index; i < n; i+= stride)
        y[i] = x[i] + y[i];
}

int main(void){
    int N = 1<<20; //1M elements; 
    float *x, *y;

    //Allocates Unified Memory - accessible from CPU or GPU

    cudaMallocManaged(&x, N*sizeof(float));
    cudaMallocManaged(&y, N*sizeof(float));

    //initiate x and y arrays on the host 
    for(int i = 0; i < N; i ++){
        x[i] = 1.0f;
        y[i] = 2.0f;

    }

    cudaMemLocation loc;
    loc.type = cudaMemLocationTypeDevice;
    loc.id = 0;

    cudaMemPrefetchAsync(x, N*sizeof(float), loc, 0);
    cudaMemPrefetchAsync(y, N*sizeof(float), loc, 0);

    // Run kernels on 1M elements on the GPU
    int blockSize = 256;
    int numBlocks = (N + blockSize - 1) / blockSize;
    add <<< numBlocks , blockSize>>>(N,x,y);

    //wait for GPU to finish before accessing on host
    cudaDeviceSynchronize();
    
    //Check for errors(all values should be 3.0f)
    float maxError = 0.0f;
    for(int i = 0; i <N; i++)
        maxError = fmax(maxError, fabs(y[i] -3.0f));
    std:: cout << "Max Error: " << maxError << std :: endl;

    //free Memory
    cudaFree(x);
    cudaFree(y);

    return 0;
}