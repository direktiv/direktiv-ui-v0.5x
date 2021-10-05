mkfile_path_main := $(abspath $(lastword $(MAKEFILE_LIST)))
mkfile_dir_main := $(dir $(mkfile_path_main))
docker_repo = $(if $(DOCKER_REPO),$(DOCKER_REPO),localhost:5000)
docker_image = $(if $(DOCKER_IMAGE),$(DOCKER_IMAGE),ui)
docker_tag = $(if $(DOCKER_TAG),:$(DOCKER_TAG),)


# Build the new server on docker
.PHONY: server
server:
	if [ ! -d ${mkfile_dir_main}reactjs-embed ]; then \
		git clone https://github.com/vorteil/reactjs-embed.git; \
	fi	
	docker build . --tag ${docker_repo}/${docker_image}${docker_tag}
	docker push ${docker_repo}/${docker_image}${docker_tag}

.PHONY: update-containers
update-containers:
	if [ ! -d ${mkfile_dir_main}reactjs-embed ]; then \
                git clone https://github.com/vorteil/reactjs-embed.git; \
        fi 
	docker build . --tag vorteil/ui
	docker tag vorteil/ui:latest vorteil/ui:${RV}
	docker push vorteil/ui
	docker push vorteil/ui:${RV}
