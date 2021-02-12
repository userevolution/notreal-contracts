for i in {01348..01484}; do s5cmd cp stylegan2/results/$i-style-interpolate/4x/vid.mp4 s3://notreal-assets/video/grid/cat/$i/vid.mp4; echo $i; done
