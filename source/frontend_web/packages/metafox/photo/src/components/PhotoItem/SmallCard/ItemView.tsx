import { Link, useGlobal } from '@metafox/framework';
import { PhotoItemProps } from '@metafox/photo/types';
import { Image, ItemView } from '@metafox/ui';
import { getImageSrc } from '@metafox/utils';
import React from 'react';
import useStyles from './styles';

const PhotoItemSmallCard = ({
  identity,
  item,
  wrapProps,
  wrapAs
}: PhotoItemProps) => {
  const classes = useStyles();
  const { assetUrl } = useGlobal();

  if (!item) return null;

  const { id, statistic } = item;
  const to = `/photo/${id}`;

  const cover = getImageSrc(item.image, '500', assetUrl('photo.no_image'));

  return (
    <ItemView
      wrapAs={wrapAs}
      wrapProps={wrapProps}
      testid={`${item.resource_name}`}
      data-eid={identity}
    >
      <div className={classes.root}>
        <div className={classes.outer}>
          <Link to={to} asModal className={classes.mediaLink}>
            <Image
              className={classes.mediaLink}
              src={cover}
              aspectRatio={'11'}
            />
            <div className={classes.photoInfo}>
              <div>
                {statistic.total_like ? (
                  <div className={classes.photoLike}>
                    <span className="ico ico-thumbup-o"></span>
                    <span className={classes.total_like}>
                      {statistic.total_like}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </ItemView>
  );
};

export default PhotoItemSmallCard;
