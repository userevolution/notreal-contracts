for i in {01601..01604}; do cat data/mediaconvert-template.json | sed "s/VIDEOGROUP/misc\/$i/" > data/mediaconvert-current.json; aws mediaconvert create-job --cli-input-json file://$(pwd)/data/mediaconvert-current.json --endpoint-url https://vasjpylpa.mediaconvert.us-east-1.amazonaws.com > ./data/mediaconvert-submission.json; echo $i; done