/**
 * @constructor
 */
Melown.MapTexture = function(map_, path_, heightMap_, extraBound_, extraInfo_, tile_, internal_) {
    this.map_ = map_;
    this.stats_ = map_.stats_;
    this.tile_ = tile_; // used only for stats
    this.internal_ = internal_; // used only for stats
    this.image_ = null;
    this.imageData_ = null;
    this.imageExtents_ = null;
    this.gpuTexture_ = null;
    this.loadState_ = 0;
    this.loadErrorTime_ = null;
    this.loadErrorCounter_ = 0;
    this.neverReady_ = false;
    this.mask_ = null;
    this.mapLoaderUrl_ = path_;
    this.heightMap_ = heightMap_ || false;
    this.extraBound_ = extraBound_;
    this.extraInfo_ = extraInfo_;
    this.statsCounter_ = 0;
    this.checkStatus_ = 0;
    this.checkType_ = null;
    this.checkValue_ = null;
    this.fastHeaderCheck_ = false;
    this.fileSize_ = 0;

    if (extraInfo_ && extraInfo_.layer_) {
        var layer_ = extraInfo_.layer_;
        
        if (layer_.availability_) {
            this.checkType_ = layer_.availability_.type_;
            switch (this.checkType_) {
                case "negative-type": this.checkValue_ = layer_.availability_.mime_; break;
                case "negative-code": this.checkValue_ = layer_.availability_.codes_; break;
                case "negative-size": this.checkValue_ = layer_.availability_.size_; break;
            }
        }       
    }

    this.cacheItem_ = null; //store killImage
    this.gpuCacheItem_ = null; //store killGpuTexture
    
    //if (path_ == "http://t0.tiles.virtualearth.net/tiles/a12021212330200.jpeg?g=854&mkt=en-US&token=Ahu6LJpWaKRj0Fzngk4d58AQFI9jKLsnvovS3ReEVcfOf6rBDCxiLDq-ycxakgOi") {
        //path_ = path_;
    //}    
};

Melown.MapTexture.prototype.kill = function() {
    this.texture_ = null;
    this.killImage();
    this.killGpuTexture();
    
    if (this.mask_) {
        this.mask_.killImage(); 
        this.mask_.killGpuTexture(); 
    }
    
    //this.tile_.validate();
};

Melown.MapTexture.prototype.killImage = function(killedByCache_) {
    this.image_ = null;
    this.imageData_ = null;

    if (killedByCache_ != true && this.cacheItem_) {
        this.map_.resourcesCache_.remove(this.cacheItem_);
        //this.tile_.validate();
    }

    if (this.mask_) {
        this.mask_.killImage(); 
    }

    if (!this.gpuTexture_) {
        this.loadState_ = 0;
    } //else {
        //this.loadState_ = this.loadState_;
    //}

    this.cacheItem_ = null;
};

Melown.MapTexture.prototype.killGpuTexture = function(killedByCache_) {
/*
    //debug only    
    if (!this.map_.lastRemoved_) {
        this.map_.lastRemoved_ = [];
    }

    //debug only    
    if (this.map_.lastRemoved_.indexOf(this.mapLoaderUrl_) != -1) {
        console.log("tex: " + this.mapLoaderUrl_);
    }

    //debug only    
    this.map_.lastRemoved_.unshift(this.mapLoaderUrl_);
    this.map_.lastRemoved_ = this.map_.lastRemoved_.slice(0,20);
*/

    if (this.gpuTexture_ != null) {
        this.stats_.gpuTextures_ -= this.gpuTexture_.size_;
        this.gpuTexture_.kill();

        this.stats_.graphsFluxTexture_[1][0]++;
        this.stats_.graphsFluxTexture_[1][1] += this.gpuTexture_.size_;

        if (this.mask_) {
            this.mask_.killGpuTexture(); 
        }
    }

    this.gpuTexture_ = null;

    if (killedByCache_ != true && this.gpuCacheItem_) {
        this.map_.gpuCache_.remove(this.gpuCacheItem_);
        //this.tile_.validate();
    }

    if (!this.image_ && !this.imageData_) {
        this.loadState_ = 0;
    }

    this.gpuCacheItem_ = null;
};

Melown.MapTexture.prototype.setBoundTexture = function(tile_, layer_) {
    if (tile_ && layer_) {
        this.extraBound_.sourceTile_ = tile_;
        this.extraBound_.layer_ = layer_;
        
        if (!tile_.boundTextures_[layer_.id_]) {
            tile_.boundLayers_[layer_.id_] = layer_;
            var path_ = layer_.getUrl(tile_.id_);
            tile_.boundTextures_[layer_.id_] = tile_.resources_.getTexture(path_, null, null, {tile_: tile_, layer_: layer_}, this.tile_, this.internal_);
        }

        this.extraBound_.texture_ = tile_.boundTextures_[layer_.id_]; 
        this.extraBound_.transform_ = this.map_.getTileTextureTransform(tile_, this.extraBound_.tile_);
        
        this.map_.markDirty();
    }
};

Melown.MapTexture.prototype.isReady = function(doNotLoad_, priority_, doNotCheckGpu_) {
    var doNotUseGpu_ = (this.map_.stats_.gpuRenderUsed_ >= this.map_.maxGpuUsed_);
    doNotLoad_ = doNotLoad_ || doNotUseGpu_;
    
    /*if (this.extraInfo_) {
        if (this.extraInfo_.tile_.id_[0] == Melown.debugId_[0] &&
            this.extraInfo_.tile_.id_[1] == Melown.debugId_[1] &&
            this.extraInfo_.tile_.id_[2] == Melown.debugId_[2]) {
                this.extraInfo_ = this.extraInfo_;
        }
    }*/
   
/*   
   if (this.mapLoaderUrl_ == "https://cdn.melown.com/mario/proxy//melown2015/tms/melown/mapycz-ophoto-cz/10-277-172.mask") {
       this.mapLoaderUrl_ = this.mapLoaderUrl_;
   }
   
   if (this.mapLoaderUrl_ == "https://cdn.melown.com/mario/proxy//melown2015/tms/melown/mapycz-ophoto-cz/10-274-176.mask") {
       this.mapLoaderUrl_ = this.mapLoaderUrl_;
   }
*/
   if (this.neverReady_) {
       return false;
   }
   
    if (this.extraBound_) {
        if (this.extraBound_.texture_) {
            while (this.extraBound_.texture_.checkStatus_ == -1) {
                var parent_ = this.extraBound_.sourceTile_.parent_;
                if (parent_.id_[0] < this.extraBound_.layer_.lodRange_[0]) {
                    this.neverReady_ = true;
                    this.extraBound_.tile_.resetDrawCommands_ = true;
                    this.map_.markDirty();
                    return false;
                }
 
                this.setBoundTexture(parent_, this.extraBound_.layer_);
            }
            
            var ready_ = this.extraBound_.texture_.isReady(doNotLoad_, priority_, doNotCheckGpu_);
            
            if (ready_ && this.checkMask_) {
                this.extraBound_.tile_.resetDrawCommands_ = (this.extraBound_.texture_.getMaskTexture() != null);
                this.checkMask_ = false;
            }

            return ready_;
            
        } else {
            this.setBoundTexture(this.extraBound_.sourceTile_, this.extraBound_.layer_);        
        }
        
        return false;
    }

    /*
    if (!this.extraBound_ && this.extraInfo_ && !this.mask_) {
        var layer_ = this.extraInfo_.layer_;
        
        if (layer_ && layer_.maskUrl_ && this.checkType_ != "metatile") {
            var path_ = layer_.getMaskUrl(this.tile_.id_);
            this.mask_ = this.tile_.resources_.getTexture(path_, null, null, null, this.tile_, this.internal_);
        }
    }*/

    switch (this.checkType_) {
        case "metatile":

            if (this.checkStatus_ != 2) {
                if (this.checkStatus_ == 0) {
                    if (this.extraInfo_ && this.extraInfo_.tile_) {
                        var metaresources_ = this.extraInfo_.tile_.boundmetaresources_;
                        if (!metaresources_) {
							metaresources_ = this.map_.resourcesTree_.findAgregatedNode(this.extraInfo_.tile_.id_, 8);
                            this.extraInfo_.tile_.boundmetaresources_ = metaresources_;
                        }
                        
                        var layer_ = this.extraInfo_.layer_;
						var path_ = this.extraInfo_.metaPath_;
						
						if(!this.extraInfo_.metaPath_) {
							var path_ = layer_.getMetatileUrl(metaresources_.id_);	
							this.extraInfo_.metaPath_ = path_;
						}
						
                        var texture_ = metaresources_.getTexture(path_, true, null, null, this.tile_, this.internal_);
                        
                        if (this.mask_) {
                            if (this.mask_.isReady(doNotLoad_, priority_, doNotCheckGpu_)) {
                                this.checkStatus_ = 2;
                            }
                        } else {
                            if (texture_.isReady(doNotLoad_, priority_, doNotCheckGpu_)) {
                                var tile_ = this.extraInfo_.tile_;
                                var value_ = texture_.getHeightMapValue(tile_.id_[1] & 255, tile_.id_[2] & 255);
                                this.checkStatus_ = (value_ & 128) ? 2 : -1;
                                
                                
                                if (this.checkStatus_ == 2) {
                                    if (!(value_ & 64)) { //load mask
                                        var path_ = layer_.getMaskUrl(tile_.id_);
                                        this.mask_ = tile_.resources_.getTexture(path_, null, null, null, this.tile_, this.internal_);
                                        this.checkStatus_ = 0;
                                        tile_.resetDrawCommands_ = true;
                                        this.map_.markDirty();
                                    }
                                }
                            }
                        }
                    }
                }
                
                if (this.checkStatus_ == -1) {
                    if (!this.extraBound_) {
                        var parent_ = this.extraInfo_.tile_.parent_;
                        if (parent_.id_[0] < this.extraInfo_.layer_.lodRange_[0]) {
                            this.neverReady_ = true;
                            this.extraInfo_.tile_.resetDrawCommands_ = true;
                            this.map_.markDirty();
                            return false;
                        }

                        this.extraBound_ = { tile_: this.extraInfo_.tile_, layer_: this.extraInfo_.layer_};
                        this.setBoundTexture(this.extraBound_.tile_.parent_, this.extraBound_.layer_);
                        this.checkMask_ = true;
                    }
    
                    while (this.extraBound_.texture_.checkStatus_ == -1) {
                        var parent_ = this.extraBound_.sourceTile_.parent_;
                        if (parent_.id_[0] < this.extraBound_.layer_.lodRange_[0]) {
                            this.neverReady_ = true;
                            this.extraBound_.tile_.resetDrawCommands_ = true;
                            this.map_.markDirty();
                            return false;
                        }
                        
                        this.setBoundTexture(parent_, this.extraBound_.layer_);        
                    }
                }

                return false;
            }
        
            break;

        case "negative-type":
        case "negative-code":
        case "negative-size":
        
            if (this.checkStatus_ != 2) {
                if (this.checkStatus_ == 0) {
                    this.scheduleHeadRequest(priority_, (this.checkType_ == "negative-size"));
                } else if (this.checkStatus_ == 3) { //loadError
                    if (this.loadErrorCounter_ <= this.map_.config_.mapLoadErrorMaxRetryCount_ &&
                        performance.now() > this.loadErrorTime_ + this.map_.config_.mapLoadErrorRetryTime_) {
                        this.scheduleHeadRequest(priority_, (this.checkType_ == "negative-size"));
                    }
                } else if (this.checkStatus_ == -1) {
            
                    if (this.extraInfo_) {
                        /*
                        if (this.extraInfo_.tile_.id_[0] == Melown.debugId_[0] &&
                            this.extraInfo_.tile_.id_[1] == Melown.debugId_[1] &&
                            this.extraInfo_.tile_.id_[2] == Melown.debugId_[2]) {
                                this.extraInfo_ = this.extraInfo_;
                        }*/
    
                        if (!this.extraBound_) {
                            this.extraBound_ = { tile_: this.extraInfo_.tile_, layer_: this.extraInfo_.layer_};
                            this.setBoundTexture(this.extraBound_.tile_.parent_, this.extraBound_.layer_);        
                        }
        
                        while (this.extraBound_.texture_.checkStatus_ == -1) {
                            this.setBoundTexture(this.extraBound_.sourceTile_.parent_, this.extraBound_.layer_);        
                        }
                    }
                }
    
                return false;
            }
            
            break;
    }

    var maskState_ = true;

    if (this.mask_) {
        maskState_ = this.mask_.isReady(doNotLoad_, priority_, doNotCheckGpu_);
    }

    if (this.loadState_ == 2) { //loaded
        if (!doNotLoad_ && this.cacheItem_) {
            this.map_.resourcesCache_.updateItem(this.cacheItem_);
        }

        if (((this.heightMap_ && !this.imageData_) || (!this.heightMap_ && !this.gpuTexture_)) &&
              this.stats_.renderBuild_ > this.map_.config_.mapMaxProcessingTime_) {
            //console.log("testure resource build overflow");
            this.map_.markDirty();
            return false;
        }

        if (doNotCheckGpu_) {
            if (this.heightMap_) {
                if (!this.imageData_) {
                    var t = performance.now();
                    this.buildHeightMap();
                    this.stats_.renderBuild_ += performance.now() - t; 
                }
            }

            return maskState_;
        }

        if (this.heightMap_) {
            if (!this.imageData_) {
                var t = performance.now();
                this.buildHeightMap();
                this.stats_.renderBuild_ += performance.now() - t; 
            }
        } else {
            if (!this.gpuTexture_) {
                if (this.map_.stats_.gpuRenderUsed_ >= this.map_.maxGpuUsed_) {
                    return false;
                }
                
                if (doNotUseGpu_) {
                    return false;
                }

                //if (this.stats_.graphsFluxTexture_ [0][0] > 2) {
                   // return false;
                //}

                var t = performance.now();
                this.buildGpuTexture();
                this.stats_.renderBuild_ += performance.now() - t; 
            }

            if (!doNotLoad_ && this.gpuCacheItem_) {
                this.map_.gpuCache_.updateItem(this.gpuCacheItem_);
            }
        }
        
        
        return maskState_;
    } else {
        if (this.loadState_ == 0) { 
            if (doNotLoad_) {
                //remove from queue
                //if (this.mapLoaderUrl_) {
                    //this.map_.loader_.remove(this.mapLoaderUrl_);
                //}
            } else {
                //not loaded
                //add to loading queue or top position in queue
                this.scheduleLoad(priority_);
            }
        } else if (this.loadState_ == 3) { //loadError
            if (this.loadErrorCounter_ <= this.map_.config_.mapLoadErrorMaxRetryCount_ &&
                performance.now() > this.loadErrorTime_ + this.map_.config_.mapLoadErrorRetryTime_) {

                this.scheduleLoad(priority_);                    
            }
        } //else load in progress
    }

    return false;
};

Melown.MapTexture.prototype.scheduleLoad = function(priority_, header_) {
    this.map_.loader_.load(this.mapLoaderUrl_, this.onLoad.bind(this, header_), priority_, this.tile_, this.internal_ ? "texture-in" : "texture-ex");
};

Melown.MapTexture.prototype.onLoad = function(header_, url_, onLoaded_, onError_) {
    this.mapLoaderCallLoaded_ = onLoaded_;
    this.mapLoaderCallError_ = onError_;

    var onerror_ = this.onLoadError.bind(this);
    var onload_ = this.onLoaded.bind(this);

    if (header_) {
        this.checkStatus_ = 1;
    } else {
        this.loadState_ = 1;
    }

    if (this.map_.config_.mapXhrImageLoad_) {
        Melown.loadBinary(url_, this.onBinaryLoaded.bind(this), onerror_, (Melown["useCredentials"] ? (this.mapLoaderUrl_.indexOf(this.map_.baseUrl_) != -1) : false), this.map_.core_.xhrParams_, "blob");
    } else {
        this.image_ = Melown.Http.imageFactory(url_, onload_, onerror_, (this.map_.core_.tokenCookieHost_ ? (url_.indexOf(this.map_.core_.tokenCookieHost_) != -1) : false));
    }
    //mapXhrImageLoad_
};

Melown.MapTexture.prototype.onLoadError = function(killBlob_) {
    if (this.map_.killed_ == true){
        return;
    }

    if (killBlob_) {
        window.URL.revokeObjectURL(this.image_.src);
    }

    this.loadState_ = 3;
    this.loadErrorTime_ = performance.now();
    this.loadErrorCounter_ ++;
    
    //make sure we try to load it again
    if (this.loadErrorCounter_ <= this.map_.config_.mapLoadErrorMaxRetryCount_) { 
        setTimeout((function(){ if (!this.map_.killed_) { this.map_.markDirty(); } }).bind(this), this.map_.config_.mapLoadErrorRetryTime_);
    }    
    
    this.mapLoaderCallError_();
};

Melown.MapTexture.prototype.onBinaryLoaded = function(data_) {
    if (this.fastHeaderCheck_ && this.checkType_ && this.checkType_ != "metatile") {
        this.onHeadLoaded(null, data_, null /*status_*/);
        
        if (this.checkStatus_ == -1) {
            this.mapLoaderCallLoaded_();
            return;
        }
    }

    var image_ = new Image();
    image_.onerror = this.onLoadError.bind(this, true);
    image_.onload = this.onLoaded.bind(this, true);
    this.image_ = image_;
    image_.src = window.URL.createObjectURL(data_);
    this.fileSize_ = data_.size;
};

Melown.MapTexture.prototype.onLoaded = function(killBlob_) {
    if (this.map_.killed_){
        return;
    }

    if (killBlob_) {
        window.URL.revokeObjectURL(this.image_.src);
    }

    var size_ = this.image_.naturalWidth * this.image_.naturalHeight * (this.heightMap_ ? 3 : 3);
    
    if (!this.image_.complete_) {
        size_ = size_;
    }
    
    //console.log(size_);

    this.cacheItem_ = this.map_.resourcesCache_.insert(this.killImage.bind(this, true), size_);

    this.map_.markDirty();
    this.loadState_ = 2;
    this.loadErrorTime_ = null;
    this.loadErrorCounter_ = 0;
    this.mapLoaderCallLoaded_();
};

Melown.MapTexture.prototype.scheduleHeadRequest = function(priority_, downloadAll_) {
    if (this.map_.config_.mapXhrImageLoad_ && this.fastHeaderCheck_) {
        this.scheduleLoad(priority_, true);
    } else {
        this.map_.loader_.load(this.mapLoaderUrl_, this.onLoadHead.bind(this, downloadAll_), priority_, this.tile_, this.internal_, this.internal_ ? "texture-in" : "texture-ex");
    }
};

//Melown.onlyOneHead_ = false;

Melown.MapTexture.prototype.onLoadHead = function(downloadAll_, url_, onLoaded_, onError_) {
    this.mapLoaderCallLoaded_ = onLoaded_;
    this.mapLoaderCallError_ = onError_;

    var onerror_ = this.onLoadHeadError.bind(this, downloadAll_);
    var onload_ = this.onHeadLoaded.bind(this, downloadAll_);

    this.checkStatus_ = 1;
/*
    if (!Melown.onlyOneHead_) {
        Melown.onlyOneHead_ = true;        
    } else {
        return;
    }

    //url_ = "http://m2.mapserver.mapy.cz/ophoto0203-m/20-568396-351581";
*/
    if (downloadAll_) {
        Melown.loadBinary(url_, onload_, onerror_, (Melown["useCredentials"] ? (this.mapLoaderUrl_.indexOf(this.map_.baseUrl_) != -1) : false), this.map_.core_.xhrParams_, "blob");
    } else {
        Melown.Http.headRequest(url_, onload_, onerror_, (Melown["useCredentials"] ? (this.mapLoaderUrl_.indexOf(this.map_.baseUrl_) != -1) : false), this.map_.core_.xhrParams_, "blob");
    }

};

Melown.MapTexture.prototype.onLoadHeadError = function(downloadAll_) {
    if (this.map_.killed_){
        return;
    }

    this.checkStatus_ = 3;
    this.loadErrorTime_ = performance.now();
    this.loadErrorCounter_ ++;
    
    //make sure we try to load it again
    if (this.loadErrorCounter_ <= this.map_.config_.mapLoadErrorMaxRetryCount_) { 
        setTimeout((function(){ if (!this.map_.killed_) { this.map_.markDirty(); } }).bind(this), this.map_.config_.mapLoadErrorRetryTime_);
    }    
    
    this.mapLoaderCallError_();
};

Melown.MapTexture.prototype.onHeadLoaded = function(downloadAll_, data_, status_) {
    if (this.map_.killed_){
        return;
    }

    this.checkStatus_ = 2;
    this.loadErrorTime_ = null;
    this.loadErrorCounter_ = 0;

    if (this.map_.config_.mapXhrImageLoad_ && this.fastHeaderCheck_) {

        switch (this.checkType_) {
            case "negative-size":
                if (data_) {
                    if (data_.size == this.checkValue_) {
                        this.checkStatus_ = -1;
                    }
                }
                break;
                
            case "negative-type":
                if (data_) {
                    if (data_.type == this.checkValue_) {
                        this.checkStatus_ = -1;
                    }
                }
                break;
                
            case "negative-code":
                if (status_) {
                    if (this.checkValue_.indexOf(status_) != -1) {
                        this.checkStatus_ = -1;
                    }
                }
                break;
        }

    } else {

        switch (this.checkType_) {
            case "negative-size":
                if (data_) {
                    if (data_.byteLength == this.checkValue_) {
                        this.checkStatus_ = -1;
                    }
                }
                break;
                
            case "negative-type":
                if (data_) {
                    if (!data_.indexOf) {
                        data_ = data_;
                    }
                    
                    if (data_.indexOf(this.checkValue_) != -1) {
                        this.checkStatus_ = -1;
                    }
                }
                break;
                
            case "negative-code":
                if (status_) {
                    if (this.checkValue_.indexOf(status_) != -1) {
                        this.checkStatus_ = -1;
                    }
                }
                break;
        }
        
        this.mapLoaderCallLoaded_();
    }
};


Melown.MapTexture.prototype.buildGpuTexture = function () {
    this.gpuTexture_ = new Melown.GpuTexture(this.map_.renderer_.gpu_, null, this.map_.core_);
    this.gpuTexture_.createFromImage(this.image_, "linear", false);
    this.stats_.gpuTextures_ += this.gpuTexture_.size_;

    this.stats_.graphsFluxTexture_[0][0]++;
    this.stats_.graphsFluxTexture_[0][1] += this.gpuTexture_.size_;

    this.gpuCacheItem_ = this.map_.gpuCache_.insert(this.killGpuTexture.bind(this, true), this.gpuTexture_.size_);
};

Melown.MapTexture.prototype.buildHeightMap = function () {
    var canvas_ = document.createElement("canvas");
    canvas_.width = this.image_.naturalWidth;
    canvas_.height = this.image_.naturalHeight;
    var ctx_ = canvas_.getContext("2d");
    ctx_.drawImage(this.image_, 0, 0);
    this.imageData_ = ctx_.getImageData(0, 0, this.image_.naturalWidth, this.image_.naturalHeight).data;
    this.imageExtents_ = [this.image_.naturalWidth, this.image_.naturalHeight];
    this.image_ = null;
};

Melown.MapTexture.prototype.getGpuTexture = function() {
    if (this.extraBound_) {
        if (this.extraBound_.texture_) {
            return this.extraBound_.texture_.gpuTexture_;
        }
        return null;
    } 

    return this.gpuTexture_;
};

Melown.MapTexture.prototype.getMaskTexture = function() {
    if (this.extraBound_) {
        if (this.extraBound_.texture_) {
            return this.extraBound_.texture_.mask_;
        }
    } 

    return this.mask_;
};

Melown.MapTexture.prototype.getGpuMaskTexture = function() {
    if (this.extraBound_) {
        if (this.extraBound_.texture_ && this.extraBound_.texture_.mask_) {
            return this.extraBound_.texture_.mask_.gpuTexture_;
        }
        return null;
    } 

    if (this.mask_) {
        return this.mask_.gpuTexture_;
    }
    
    return null;
};

Melown.MapTexture.prototype.getHeightMapValue = function(x, y) {
    if (this.imageData_) {
        return this.imageData_[(y * this.imageExtents_[0] + x)*4];
    }
    
    return 0;
};

Melown.MapTexture.prototype.getTransform = function() {
    if (this.extraBound_) {
        if (this.extraBound_.texture_) {
            return this.extraBound_.transform_;
        }
        return null;
    } 

    return [1,1,0,0];
};
